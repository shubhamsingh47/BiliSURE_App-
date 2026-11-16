# BiliSURE — REST API Documentation (v1)

Base URL: `http://localhost:5000/api/v1`  
All protected endpoints require HTTP header: `Authorization: Bearer <access_token>`

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/register`
Create clinician / provider user account.
- **Request Body**:
  ```json
  {
    "email": "dr.smith@hospital.org",
    "password": "SecurePassword123!",
    "name": "Dr. Smith",
    "role": "doctor",
    "department": "NICU",
    "facility": "Central Hospital"
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "651a...", "email": "...", "name": "...", "role": "doctor" },
      "accessToken": "eyJhb...",
      "refreshToken": "eyJhb..."
    }
  }
  ```

### `POST /auth/login`
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response 200 OK**: Access token, refresh token, user details.

### `POST /auth/refresh`
- **Request Body**: `{ "refreshToken": "..." }`
- **Response 200 OK**: New access token and rotated refresh token.

---

## 2. Patients / Babies (`/api/v1/babies`)

### `GET /babies`
Query list of registered infants with filtering and pagination.
- **Query Params**: `department`, `severityState`, `status`, `search`, `page`, `limit`
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "_id": "651a...",
          "uhid": "M1A2N3S4I5",
          "name": "Baby 1",
          "parentsName": "Jane Doe",
          "dateOfBirth": "2026-11-15T08:00:00.00Z",
          "severityState": "critical",
          "latestReading": { "value": 18.0, "unit": "mg/dL", "timestamp": "..." }
        }
      ],
      "pagination": { "total": 12, "page": 1, "totalPages": 1 }
    }
  }
  ```

### `POST /babies`
Register new patient.
- **Request Body**:
  ```json
  {
    "uhid": "M1A2N3S4I5",
    "name": "Baby of Jane",
    "parentsName": "Jane Doe",
    "dateOfBirth": "2026-11-15T08:00:00.00Z",
    "weight": 3.2,
    "height": 49.5,
    "assignedDoctor": "Dr. XYZ",
    "facility": "General Hospital",
    "department": "NICU",
    "severityState": "moderate"
  }
  ```

---

## 3. Bilirubin Readings (`/api/v1/readings`)

### `GET /readings/baby/:babyId`
Fetch chronological reading history for trend graphs.
- **Query Params**: `timeRange` (`1hr`, `8hr`, `16hr`, `24hr`, `all`)

### `POST /readings`
Log new bilirubin measurement.
- **Request Body**:
  ```json
  {
    "clientOperationId": "550e8400-e29b-41d4-a716-446655440000",
    "babyId": "651a...",
    "value": 10.0,
    "unit": "mg/dL",
    "measurementSite": "palms_and_soles",
    "source": "manual_entry",
    "symptoms": "Mild scleral icterus",
    "timestamp": "2026-11-16T04:30:00.000Z"
  }
  ```

---

## 4. Recommendations (`/api/v1/recommendations`)

### `GET /recommendations/baby/:babyId`
Returns both rule-based clinical recommendations and attending provider instructions.

---

## 5. Analytics & Dashboard Summary (`/api/v1/analytics`)

### `GET /analytics/dashboard-summary`
Aggregates active patients, vacant phototherapy stations, total admits, and category distribution for donut charts.

### `GET /analytics/export`
Generates formatted CSV download for patient cohorts, bilirubin readings, and discharge summaries.

---

## 6. Offline Synchronization (`/api/v1/sync`)

### `POST /sync/batch`
Batch ingestion endpoint for queued offline operations with idempotent duplicate checking.
