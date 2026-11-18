# BiliSURE — Architecture Documentation

## 1. System Overview

BiliSURE is a user-facing mobile healthcare application and modular monolithic backend engineered for neonatal jaundice monitoring, transcutaneous and serum bilirubin tracking, phototherapy treatment session management, and clinical discharge readiness.

```
+-------------------------------------------------------------------------+
|                              MOBILE CLIENT                              |
|   React Native (TypeScript) + React Navigation + NativeWind / Tailwind   |
+------------------------------------+------------------------------------+
                                     |
                                     v
                  +-------------------------------------+
                  |   Data Access & Abstraction Layer   |
                  |     (Zustand Stores + Axios API)    |
                  +------------------+------------------+
                                     |
                          HTTPS / REST (JWT Tokens)
                                     |
                                     v
+-------------------------------------------------------------------------+
|                             EXPRESS BACKEND                             |
|  Node.js + Express (TypeScript) + Zod Validation + Centralized Errors   |
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
                  |       Permanent Source of Truth     |
                  | Compound Indexes, Strict Validation |
                  +-------------------------------------+
```

---

## 2. Frontend Architecture (React Native)

The mobile client is structured using a **feature-first** modular pattern:
- **`src/app/`**: Root configuration, navigation container, global providers (QueryClient, AuthProvider).
- **`src/features/`**: Feature-encapsulated modules:
  - `authentication`: Login, registration, token refresh, secure persistence.
  - `dashboard`: Department filtering, patient search, severity filtering, empty state views.
  - `babies`: Patient registration, medical identifier (UHID) tracking, demographic metadata.
  - `bilirubin`: Measurement logging (mg/dL), measurement site selection (palms, soles, forehead, sternum), timestamping.
  - `observations`: Clinical notes, nurse/provider observations, site discoloration tracking.
  - `recommendations`: Phototherapy guidance, clinical risk classification (Low, Intermediate, High) per Bhutani nomogram.
  - `discharge`: Discharge eligibility tracking, initial vs. discharge value comparisons.
  - `hospitalNurse`: Live phototherapy treatment tracking, duration timing, cycle history, and sample history.
  - `devices`: Device profiles, calibration logs, accuracy checks, test quotas, diagnostics.
  - `analytics`: Multi-category charts, station vacancy indicators, stories/insights carousel.
  - `reports`: Date-ranged CSV / JSON export engine.
- **`src/components/`**: Atomic, reusable UI primitives (Buttons, Inputs, Cards, Headers, Charts, Modals).
- **`src/services/`**: API client (`apiClient` Axios instance with auto-refresh interceptors), `PatientsApi` abstraction layer.
- **`src/store/`**: Lightweight Zustand stores (`useAuthStore`, `usePatientStore`, `useNetworkStore`) directly managing live backend state without mock or seed fallback dependencies.

---

## 3. Backend Architecture (Express + TypeScript)

The backend follows a **Modular Monolith** pattern designed for high reliability and horizontal scalability:
- **Stateless instances**: Sessions are strictly governed by short-lived JWT access tokens and rotatable refresh tokens.
- **Strict request lifecycle**:
  `Request -> Rate Limiter -> Helmet / CORS -> Auth Middleware -> Zod Validation -> Controller -> Domain Service -> Mongoose Model -> MongoDB Atlas -> Formatted JSON Response`
- **Centralized Error Handling**: Standardized error envelopes (`{ success: false, error: { code, message, details } }`).
- **Audit & Operational Tracking**: Patient registration, bilirubin readings, and clinical observations carry idempotent client operation identifiers (`clientOperationId`) preventing duplicate writes.

---

## 4. Scalability & Reliability Strategy

1. **MongoDB Atlas as Single Source of Truth**: All application records are persisted directly to MongoDB Atlas. The backend alone maintains database connections; database credentials and URIs are never exposed to mobile clients.
2. **Database Indexing**: Compound and unique indexes on `(babyId, timestamp)`, `(uhid)`, `(clientOperationId)`, and `(email)` ensure query execution times remain below 10ms as datasets scale.
3. **Clean Empty States**: The frontend gracefully displays informative, empty-state UI when collections contain no records, avoiding synthetic overrides or hardcoded seed repopulation.
