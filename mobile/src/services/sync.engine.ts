import { apiClient } from './api.client';
import { SyncQueueRepository } from '../database/repositories/SyncQueueRepository';
import { BabyRepository } from '../database/repositories/BabyRepository';
import { ReadingRepository } from '../database/repositories/ReadingRepository';
import { SyncQueueItem } from '../types';

export class SyncEngine {
  private static isSyncing = false;

  static async syncPending(): Promise<{ syncedCount: number; failedCount: number }> {
    if (this.isSyncing) return { syncedCount: 0, failedCount: 0 };
    this.isSyncing = true;

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await SyncQueueRepository.getPending();
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return { syncedCount: 0, failedCount: 0 };
      }

      console.log(`[SyncEngine] Processing ${pendingItems.length} pending offline operations...`);

      const payload = {
        operations: pendingItems.map((item) => ({
          operationId: item.operationId,
          entityType: item.entityType,
          action: item.action,
          payload: JSON.parse(item.payloadJson),
          timestamp: item.createdAt,
        })),
      };

      const response = await apiClient.post('/sync/batch', payload);
      const results: any[] = response.data?.data || [];

      for (const res of results) {
        if (res.status === 'synced') {
          await SyncQueueRepository.markCompleted(res.operationId);
          syncedCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[SyncEngine] Sync finished: ${syncedCount} synced, ${failedCount} failed.`);
    } catch (err: any) {
      console.warn('[SyncEngine] Sync failed or offline:', err.message);
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, failedCount };
  }
}
