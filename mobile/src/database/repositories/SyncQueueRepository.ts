import { getDatabase, memoryTables, isInMemoryFallback } from '../sqlite';
import { SyncQueueItem } from '../../types';

export class SyncQueueRepository {
  static async getPending(): Promise<SyncQueueItem[]> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      return memoryTables.sync_queue.filter(q => q.status === 'pending' || q.status === 'failed');
    }

    try {
      const [results] = await db.executeSql(
        "SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY created_at ASC"
      );
      const items: SyncQueueItem[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          operationId: row.operation_id,
          entityType: row.entity_type,
          action: row.action,
          payloadJson: row.payload_json,
          status: row.status,
          retryCount: row.retry_count,
          lastError: row.last_error,
          createdAt: row.created_at,
        });
      }
      return items;
    } catch {
      return memoryTables.sync_queue.filter(q => q.status === 'pending' || q.status === 'failed');
    }
  }

  static async enqueue(item: SyncQueueItem): Promise<void> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      memoryTables.sync_queue.push(item);
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO sync_queue
      (operation_id, entity_type, action, payload_json, status, retry_count, last_error, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      item.operationId,
      item.entityType,
      item.action,
      item.payloadJson,
      item.status,
      item.retryCount,
      item.lastError || null,
      item.createdAt,
    ];

    await db.executeSql(sql, params).catch(() => {
      memoryTables.sync_queue.push(item);
    });
  }

  static async markCompleted(operationId: string): Promise<void> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      const idx = memoryTables.sync_queue.findIndex(q => q.operationId === operationId);
      if (idx !== -1) memoryTables.sync_queue.splice(idx, 1);
      return;
    }

    await db.executeSql('DELETE FROM sync_queue WHERE operation_id = ?', [operationId]).catch(() => {});
  }
}
