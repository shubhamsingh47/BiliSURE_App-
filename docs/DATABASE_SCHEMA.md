# BiliSURE — Database Schema & Data Models

## 1. MongoDB Architecture (Central Source of Truth)

All medical records, user identities, and device associations are persisted in MongoDB with Mongoose schema validation, strict typing, and compound indexes.

### Collections Overview

1. **`users`**:
   - `_id`: ObjectId
   - `email`: String (unique, index)
   - `passwordHash`: String
   - `name`: String
   - `role`: Enum (`admin`, `doctor`, `nurse`, `caregiver`)
   - `department`: String (e.g. `NICU`, `Maternity`, `Pediatrics`)
   - `facility`: String
   - `isActive`: Boolean
   - `createdAt`, `updatedAt`: Date

2. **`babies`**:
   - `_id`: ObjectId
   - `uhid`: String (unique, index) — Universal Hospital Identifier
   - `name`: String
   - `parentsName`: String
   - `dateOfBirth`: Date
   - `gestationalAgeWeeks`: Number (optional)
   - `birthWeightGrams`: Number
   - `currentWeightGrams`: Number
   - `heightCm`: Number
   - `assignedDoctor`: String
   - `facility`: String
   - `department`: String
   - `severityState`: Enum (`normal`, `moderate`, `critical`)
   - `status`: Enum (`admitted`, `under_treatment`, `in_observation`, `discharged`)
   - `registeredBy`: ObjectId -> `users`
   - `createdAt`, `updatedAt`: Date

3. **`bilirubinReadings`**:
   - `_id`: ObjectId
   - `clientOperationId`: String (unique, index) — for idempotent offline synchronization
   - `babyId`: ObjectId -> `babies` (index)
   - `value`: Number (precision to 1 decimal place, e.g. 10.0)
   - `unit`: String (default: `mg/dL`)
   - `measurementSite`: Enum (`forehead`, `sternum`, `palms_and_soles`, `abdomen`)
   - `source`: Enum (`manual_entry`, `device_transcutaneous`, `serum_lab`)
   - `deviceId`: ObjectId -> `devices` (optional)
   - `operatorId`: ObjectId -> `users`
   - `operatorName`: String
   - `symptoms`: [String]
   - `riskLevel`: Enum (`low`, `intermediate`, `high`)
   - `timestamp`: Date (index)
   - `isInitial`: Boolean
   - `isDischarge`: Boolean
   - `createdAt`, `updatedAt`: Date

4. **`observations`**:
   - `_id`: ObjectId
   - `clientOperationId`: String (unique, index)
   - `babyId`: ObjectId -> `babies` (index)
   - `observedBy`: ObjectId -> `users`
   - `observerName`: String
   - `site`: String (e.g. `Face`, `Trunk`, `Extremities`)
   - `clinicalNotes`: String
   - `bilirubinValue`: Number
   - `timestamp`: Date
   - `createdAt`, `updatedAt`: Date

5. **`recommendations`**:
   - `_id`: ObjectId
   - `babyId`: ObjectId -> `babies` (index)
   - `readingId`: ObjectId -> `bilirubinReadings`
   - `suggestedAction`: Enum (`phototherapy`, `exchange_transfusion`, `continue_monitoring`, `discharge_ready`)
   - `frequency`: String (e.g. `Continuous`, `q4h`, `q8h`)
   - `guidelineReference`: String (e.g. `AAP 2022 Guidelines for Hyperbilirubinemia`)
   - `providerNotes`: String
   - `approvedBy`: ObjectId -> `users` (optional)
   - `status`: Enum (`suggested`, `accepted`, `overridden`, `completed`)
   - `timestamp`: Date

6. **`devices`**:
   - `_id`: ObjectId
   - `serialNumber`: String (unique, index)
   - `model`: String (e.g. `BiliSURE-X1`)
   - `macAddress`: String
   - `facility`: String
   - `department`: String
   - `autoCalibrateEnabled`: Boolean
   - `accuracyTestPassed`: Boolean
   - `totalTestsCapacity`: Number (default: 14000)
   - `remainingTests`: Number (default: 7500)
   - `lastCalibratedAt`: Date
   - `status`: Enum (`active`, `calibrated`, `alert_broken`, `maintenance`)
   - `createdAt`, `updatedAt`: Date

7. **`auditLogs`**:
   - `_id`: ObjectId
   - `userId`: ObjectId -> `users`
   - `action`: String (e.g. `CREATE_BABY`, `LOG_READING`, `DISCHARGE`)
   - `entityType`: String
   - `entityId`: String
   - `payload`: Object
   - `ipAddress`: String
   - `timestamp`: Date

---

## 2. SQLite Local Database Schema (Mobile Offline Cache)

Local tables mirror operational data with local UUIDs and server mapping.

```sql
CREATE TABLE IF NOT EXISTS local_babies (
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
    sync_status TEXT DEFAULT 'synced',
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_readings (
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
    created_at TEXT NOT NULL,
    FOREIGN KEY(baby_id) REFERENCES local_babies(id)
);

CREATE TABLE IF NOT EXISTS local_observations (
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
);

CREATE TABLE IF NOT EXISTS local_devices (
    id TEXT PRIMARY KEY,
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    mac_address TEXT,
    remaining_tests INTEGER DEFAULT 7500,
    total_tests INTEGER DEFAULT 14000,
    is_calibrated INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS sync_queue (
    operation_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```
