import { getDatabase, memoryTables, isInMemoryFallback } from '../sqlite';
import { BilirubinReading } from '../../types';

export class ReadingRepository {
  static async getByBabyId(babyId: string): Promise<BilirubinReading[]> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      return memoryTables.local_readings.filter((r) => r.babyId === babyId);
    }

    try {
      const [results] = await db.executeSql(
        'SELECT * FROM local_readings WHERE baby_id = ? ORDER BY timestamp DESC',
        [babyId]
      );
      const items: BilirubinReading[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id,
          serverId: row.server_id,
          clientOperationId: row.client_operation_id,
          babyId: row.baby_id,
          value: row.value,
          unit: row.unit || 'mg/dL',
          method: row.method || 'TSB',
          sampleTimestamp: row.sample_timestamp || row.timestamp,
          postnatalAgeHours: row.postnatal_age_hours || 24,
          bhutaniZone: row.bhutani_zone || 'low',
          phototherapyPhase: row.phototherapy_phase || 'pre_phototherapy',
          measurementSite: row.measurement_site,
          source: row.source,
          operatorName: row.operator_name,
          symptoms: row.symptoms,
          riskLevel: row.risk_level || 'low',
          timestamp: row.timestamp,
          isInitial: row.is_initial === 1,
          isDischarge: row.is_discharge === 1,
          syncStatus: row.sync_status,
        });
      }
      return items;
    } catch {
      return memoryTables.local_readings.filter((r) => r.babyId === babyId);
    }
  }

  static async insertOrUpdate(reading: BilirubinReading): Promise<void> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      const idx = memoryTables.local_readings.findIndex((r) => r.clientOperationId === reading.clientOperationId);
      if (idx !== -1) {
        memoryTables.local_readings[idx] = reading;
      } else {
        memoryTables.local_readings.unshift(reading);
      }
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO local_readings
      (id, server_id, client_operation_id, baby_id, value, unit, measurement_site, source, operator_name, symptoms, risk_level, timestamp, is_initial, is_discharge, sync_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      reading.id,
      reading.serverId || null,
      reading.clientOperationId,
      reading.babyId,
      reading.value,
      reading.unit || 'mg/dL',
      reading.measurementSite || 'palms_and_soles',
      reading.source || 'manual_entry',
      reading.operatorName || 'Nurse A',
      reading.symptoms || '',
      reading.riskLevel || 'low',
      reading.timestamp,
      reading.isInitial ? 1 : 0,
      reading.isDischarge ? 1 : 0,
      reading.syncStatus || 'pending',
      new Date().toISOString(),
    ];

    await db.executeSql(sql, params).catch(() => {
      memoryTables.local_readings.unshift(reading);
    });
  }
}
