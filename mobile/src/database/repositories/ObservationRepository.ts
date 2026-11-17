import { getDatabase, memoryTables, isInMemoryFallback } from '../sqlite';
import { ClinicalObservation } from '../../types';

export class ObservationRepository {
  static async getAll(): Promise<ClinicalObservation[]> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      return memoryTables.local_observations || [];
    }

    try {
      const [results] = await db.executeSql(
        'SELECT * FROM local_observations ORDER BY timestamp DESC'
      );
      const items: ClinicalObservation[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id,
          serverId: row.server_id,
          clientOperationId: row.client_operation_id,
          babyId: row.baby_id,
          site: row.site,
          observerName: row.observer_name || 'Nurse A',
          clinicalNotes: row.clinical_notes || '',
          bilirubinValue: row.bilirubin_value,
          timestamp: row.timestamp,
          syncStatus: row.sync_status,
        });
      }
      return items;
    } catch {
      return memoryTables.local_observations || [];
    }
  }

  static async getByBabyId(babyId: string): Promise<ClinicalObservation[]> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      return (memoryTables.local_observations || []).filter((o) => o.babyId === babyId);
    }

    try {
      const [results] = await db.executeSql(
        'SELECT * FROM local_observations WHERE baby_id = ? ORDER BY timestamp DESC',
        [babyId]
      );
      const items: ClinicalObservation[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id,
          serverId: row.server_id,
          clientOperationId: row.client_operation_id,
          babyId: row.baby_id,
          site: row.site,
          observerName: row.observer_name || 'Nurse A',
          clinicalNotes: row.clinical_notes || '',
          bilirubinValue: row.bilirubin_value,
          timestamp: row.timestamp,
          syncStatus: row.sync_status,
        });
      }
      return items;
    } catch {
      return (memoryTables.local_observations || []).filter((o) => o.babyId === babyId);
    }
  }

  static async insertOrUpdate(obs: ClinicalObservation): Promise<void> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      if (!memoryTables.local_observations) memoryTables.local_observations = [];
      const idx = memoryTables.local_observations.findIndex(
        (o) => o.id === obs.id || o.clientOperationId === obs.clientOperationId
      );
      if (idx !== -1) {
        memoryTables.local_observations[idx] = obs;
      } else {
        memoryTables.local_observations.unshift(obs);
      }
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO local_observations
      (id, server_id, client_operation_id, baby_id, site, observer_name, clinical_notes, bilirubin_value, timestamp, sync_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      obs.id,
      obs.serverId || null,
      obs.clientOperationId || `obs_op_${obs.id}`,
      obs.babyId,
      obs.site || 'Forehead',
      obs.observerName || 'Nurse A',
      obs.clinicalNotes || '',
      obs.bilirubinValue,
      obs.timestamp,
      obs.syncStatus || 'pending',
      new Date().toISOString(),
    ];

    await db.executeSql(sql, params).catch(() => {
      if (!memoryTables.local_observations) memoryTables.local_observations = [];
      memoryTables.local_observations.unshift(obs);
    });
  }
}
