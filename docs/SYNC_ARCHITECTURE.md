# BiliSURE — Offline-First Synchronization Architecture

## 1. Overview & Guarantees

In healthcare environments, network drops inside NICUs, rural clinics, or maternity wards must never jeopardize patient data. The BiliSURE sync engine enforces the following guarantees:

1. **Zero Data Loss**: Every measurement or profile creation writes to local SQLite before network transmission.
2. **Idempotent Writes**: All write operations generate a client UUID (`clientOperationId`). Re-sending an existing operation ID never creates duplicate medical records.
3. **Resilience to Termination**: Pending sync operations reside in durable SQLite storage, resuming immediately on app startup or network reconnection.
4. **Deterministic Server Mapping**: Server-generated MongoDB `_id`s are reflected back and stored in the local SQLite `server_id` column upon acknowledgment.

---

## 2. Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Nurse as Clinician / Nurse
    participant UI as React Native UI
    participant SQLite as Local SQLite DB
    participant Queue as Sync Queue Manager
    participant Net as NetInfo Monitor
    participant API as Backend Express API
    participant Mongo as MongoDB Atlas

    Nurse->>UI: Logs Bilirubin Reading (e.g. 10.0 mg/dL)
    UI->>UI: Zod Validation
    UI->>SQLite: Persist Reading (sync_status='pending')
    UI->>Queue: Enqueue Operation (operation_id=UUID, payload)
    UI-->>Nurse: Immediate UI Update (Optimistic Feedback)

    Queue->>Net: Check Connectivity State
    alt Network Available
        Queue->>API: POST /api/v1/sync/operations (batch or single)
        API->>Mongo: Check clientOperationId (Idempotency)
        alt Not Found
            API->>Mongo: Insert Reading Document
            Mongo-->>API: Persisted (Returns server _id, timestamp)
        else Already Exists
            API-->>API: Fetch Existing Document
        end
        API-->>Queue: HTTP 200/201 Confirmation { operationId, serverId, status: 'synced' }
        Queue->>SQLite: UPDATE local_readings SET sync_status='synced', server_id=?
        Queue->>SQLite: DELETE FROM sync_queue WHERE operation_id=?
    else Offline or Network Timeout
        Queue->>Queue: Mark status='failed', schedule exponential backoff
        Net-->>Queue: Network Restored Event
        Queue->>Queue: Re-trigger Flush Queue
    end
```

---

## 3. Conflict Resolution Strategy

- **Bilirubin Readings & Observations**: Strictly additive and append-only. Medical readings are historical observations at specific timestamps and are never overwritten. If an entry needs correction, a clinical amendment observation is added.
- **Patient Profiles (Babies)**: Last-Write-Wins with server-enforced clinical verification. Demographic changes (e.g. weight update) track `updatedAt`. If server `updatedAt` is greater than client timestamp, server state takes precedence unless client modification was created more recently while offline.
