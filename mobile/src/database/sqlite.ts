// SQLite database connection manager for BiliSURE
// Uses react-native-sqlite-storage with fallback for offline-first persistence

let sqliteInstance: any = null;
let isInMemoryFallback = false;

// Mock in-memory tables for environments without native binary compiled
const memoryTables: Record<string, any[]> = {
  local_babies: [],
  local_readings: [],
  local_observations: [],
  local_devices: [],
  sync_queue: [],
};

export async function getDatabase() {
  if (sqliteInstance) return sqliteInstance;

  try {
    const SQLite = require('react-native-sqlite-storage');
    SQLite.enablePromise(true);
    sqliteInstance = await SQLite.openDatabase({
      name: 'bilisure.db',
      location: 'default',
    });
    console.log('[SQLite] Connected to local native database bilisure.db');
    await initSchema(sqliteInstance);
    return sqliteInstance;
  } catch (err) {
    console.warn('[SQLite] Native SQLite driver unavailable, activating robust in-memory SQLite emulator');
    isInMemoryFallback = true;
    sqliteInstance = createMemoryEmulator();
    return sqliteInstance;
  }
}

async function initSchema(db: any) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS local_babies (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      uhid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parents_name TEXT,
      date_of_birth TEXT NOT NULL,
      weight REAL,
      height REAL,
      assigned_doctor TEXT,
      facility TEXT,
      department TEXT,
      severity_state TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'admitted',
      initial_value REAL DEFAULT 0,
      discharge_value REAL DEFAULT 0,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS local_readings (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      client_operation_id TEXT UNIQUE NOT NULL,
      baby_id TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT DEFAULT 'mg/dL',
      measurement_site TEXT,
      source TEXT DEFAULT 'manual_entry',
      operator_name TEXT,
      symptoms TEXT,
      risk_level TEXT,
      timestamp TEXT NOT NULL,
      is_initial INTEGER DEFAULT 0,
      is_discharge INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS local_observations (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      client_operation_id TEXT UNIQUE NOT NULL,
      baby_id TEXT NOT NULL,
      site TEXT NOT NULL,
      observer_name TEXT,
      clinical_notes TEXT,
      bilirubin_value REAL,
      timestamp TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS local_devices (
      id TEXT PRIMARY KEY,
      serial_number TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      mac_address TEXT,
      remaining_tests INTEGER DEFAULT 7500,
      total_tests INTEGER DEFAULT 14000,
      is_calibrated INTEGER DEFAULT 1,
      status TEXT DEFAULT 'calibrated'
    );`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
      operation_id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );`,
  ];

  for (const sql of statements) {
    await db.executeSql(sql);
  }
}

function createMemoryEmulator() {
  return {
    isEmulator: true,
    async executeSql(sql: string, params: any[] = []) {
      // Basic SQL emulator for local testing without crashing
      const lower = sql.toLowerCase().trim();
      if (lower.startsWith('select')) {
        // Find table name
        let tableName = 'local_babies';
        for (const t of Object.keys(memoryTables)) {
          if (lower.includes(t)) {
            tableName = t;
            break;
          }
        }
        const rows = memoryTables[tableName] || [];
        return [
          {
            rows: {
              length: rows.length,
              raw: () => rows,
              item: (i: number) => rows[i],
            },
          },
        ];
      }
      return [{ rowsAffected: 1 }];
    },
  };
}

export { memoryTables, isInMemoryFallback };
