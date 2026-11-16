import { getDatabase, memoryTables, isInMemoryFallback } from '../sqlite';
import { Baby } from '../../types';

export class BabyRepository {
  static async getAll(): Promise<Baby[]> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      return [...memoryTables.local_babies];
    }

    try {
      const [results] = await db.executeSql('SELECT * FROM local_babies ORDER BY updated_at DESC');
      const items: Baby[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id,
          serverId: row.server_id,
          uhid: row.uhid,
          name: row.name,
          parentsName: row.parents_name,
          dateOfBirth: row.date_of_birth,
          weight: row.weight,
          height: row.height,
          assignedDoctor: row.assigned_doctor,
          facility: row.facility,
          department: row.department,
          severityState: row.severity_state,
          status: row.status,
          initialValue: row.initial_value,
          dischargeValue: row.discharge_value,
          syncStatus: row.sync_status,
          updatedAt: row.updated_at,
        });
      }
      return items;
    } catch {
      return memoryTables.local_babies;
    }
  }

  static async insertOrUpdate(baby: Baby): Promise<void> {
    const db = await getDatabase();
    if (isInMemoryFallback) {
      const idx = memoryTables.local_babies.findIndex(b => b.id === baby.id || b.uhid === baby.uhid);
      if (idx !== -1) {
        memoryTables.local_babies[idx] = baby;
      } else {
        memoryTables.local_babies.unshift(baby);
      }
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO local_babies 
      (id, server_id, uhid, name, parents_name, date_of_birth, weight, height, assigned_doctor, facility, department, severity_state, status, initial_value, discharge_value, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      baby.id,
      baby.serverId || null,
      baby.uhid,
      baby.name,
      baby.parentsName,
      baby.dateOfBirth,
      baby.weight || null,
      baby.height || null,
      baby.assignedDoctor || 'Dr. XYZ',
      baby.facility || 'Central Children Hospital',
      baby.department || 'NICU',
      baby.severityState || 'normal',
      baby.status || 'admitted',
      baby.initialValue || 0,
      baby.dischargeValue || 0,
      baby.syncStatus || 'synced',
      baby.updatedAt || new Date().toISOString(),
    ];

    await db.executeSql(sql, params).catch(() => {
      // fallback in memory
      memoryTables.local_babies.unshift(baby);
    });
  }

  static async getById(idOrUhid: string): Promise<Baby | null> {
    const all = await this.getAll();
    return all.find(b => b.id === idOrUhid || b.uhid === idOrUhid) || null;
  }
}
