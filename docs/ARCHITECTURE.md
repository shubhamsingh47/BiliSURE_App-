# BiliSURE — Architecture Documentation

## 1. System Overview

BiliSURE is a user-facing, offline-first mobile healthcare application and modular monolithic backend engineered for neonatal jaundice monitoring, transcutaneous bilirubin tracking, phototherapy recommendation management, and clinical discharge readiness.

```
+-------------------------------------------------------------------------+
|                              MOBILE CLIENT                              |
|   React Native (TypeScript) + React Navigation + NativeWind / Tailwind   |
+------------------------------------+------------------------------------+
                                     |
                                     v
                  +-------------------------------------+
                  |   Data Access & Abstraction Layer   |
                  |  (TanStack Query + Zustand Store)   |
                  +---------+-----------------+---------+
                            |                 |
                            v                 v
            +-----------------------+   +-----------------------------+
            | SQLite Local Database |   |   Offline Sync Engine       |
            |   (Offline Storage)   |   |   (Sync Queue + Conflict    |
            |                       |   |    Resolution + Backoff)    |
            +-----------------------+   +--------------+--------------+
                                                       |
                                            HTTPS / REST (JWT)
                                                       |
                                                       v
+-------------------------------------------------------------------------+
|                             EXPRESS BACKEND                             |
|  Node.js + Express (TypeScript) + Zod Validation + Swagger/OpenAPI Docs  |
+------------------------------------+------------------------------------+
                                     |
                                     v
                  +-------------------------------------+
                  |       Modular Service Domains       |
                  | Auth | Babies | Readings | Devices  |
                  | Observations | Recs | Analytics     |
                  +------------------+------------------+
                                     |
                                     v
                  +-------------------------------------+
                  |       MongoDB Atlas (Mongoose)      |
                  | Compound Indexes, Strict Validation |
                  +-------------------------------------+
```

---

## 2. Frontend Architecture (React Native)

The mobile client is structured using a **feature-first** modular pattern:
- **`src/app/`**: Root configuration, navigation container, global providers (QueryClient, AuthProvider, SQLiteProvider).
- **`src/features/`**: Feature-encapsulated modules:
  - `authentication`: Login, registration, token refresh, secure keychain persistence.
  - `dashboard`: Department filtering, daily/yesterday reading feeds, priority status indicators.
  - `babies`: Patient registration, medical identifier (UHID) tracking, demographic metadata.
  - `bilirubin`: Measurement logging (mg/dL), measurement site selection (palms, soles, forehead, sternum), timestamping.
  - `observations`: Clinical notes, nurse/provider observations, symptoms.
  - `recommendations`: Phototherapy guidance, clinical risk classification (Low, Intermediate, High) per AAP/NICE guidelines.
  - `discharge`: Discharge eligibility tracking, initial vs. discharge value comparisons.
  - `devices`: Device profiles, calibration logs, accuracy checks, test quotas, diagnostics.
  - `analytics`: Multi-category donut charts, station vacancy indicators, stories/insights carousel.
  - `reports`: Date-ranged CSV / JSON export engine.
- **`src/components/`**: Atomic, reusable UI primitives (Buttons, Inputs, Cards, Headers, Charts, Modals).
- **`src/database/`**: SQLite schema definitions, migration runners, and strongly-typed repository classes.
- **`src/services/`**: API client (Axios with auto-refresh interceptors), network status monitor, device service abstraction.
- **`src/store/`**: Lightweight Zustand stores for UI state, active patient session, and sync queue telemetry.

---

## 3. Backend Architecture (Express + TypeScript)

The backend follows a **Modular Monolith** pattern designed for high horizontal scalability:
- **Stateless instances**: Sessions are strictly governed by short-lived JWT access tokens and rotatable refresh tokens.
- **Strict request lifecycle**:
  `Request -> Rate Limiter -> Helmet / CORS -> Auth Middleware -> Zod Validation -> Controller -> Domain Service -> Mongoose Repository -> Formatted JSON Response`
- **Centralized Error Handling**: Standardized RFC-7807 compliant error envelopes (`{ success: false, error: { code, message, details } }`).
- **Audit Logging**: Every clinical record modification writes immutable audit entries tracking operator ID, timestamp, and delta.

---

## 4. Scalability & Reliability Strategy

1. **Database Indexing**: Compound indexes on `(babyId, timestamp)` and `(uhid, organizationId)` ensure query execution times remain below 10ms as datasets expand.
2. **Offline-First Resilience**: Mobile clients persist every interaction into local SQLite before queuing an idempotent operation. Even with app termination or connectivity interruption, operations replay safely without creating duplicate medical records.
3. **Graceful Degradation**: When backend services are unreachable, the mobile application functions in fully local mode, visibly flagging pending synchronization status to healthcare workers.
