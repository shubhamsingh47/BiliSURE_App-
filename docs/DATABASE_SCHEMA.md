# BiliSURE — Database Schema & Data Models

## 1. MongoDB Atlas Architecture (Permanent Source of Truth)

All medical records, patient profiles, bilirubin readings, observations, phototherapy stations, and hospital data are persisted in the MongoDB Atlas database `BiliSURE` via Mongoose schema validation, strict typing, and compound indexes.

### Verified Collections Overview (12 Collections)

1. **`babies`**:
   - `_id`: ObjectId
   - `uhid`: String (unique, uppercase, indexed) — Universal Hospital Identifier e.g. "BS-IN-972612"
   - `bilisureId`: String (indexed) — Permanent BiliSURE Patient ID e.g. "BS-2026-3110"
   - `name`: String (indexed)
   - `parentsName`: String
   - `guardianPhone`: String
   - `guardianAddress`: String
   - `bloodGroup`: String
   - `rhesusFactor`: Enum (`positive`, `negative`, `unknown`)
   - `directCoombsTest`: Enum (`positive`, `negative`, `not_tested`)
   - `dateOfBirth`: Date
   - `exactTimeOfBirth`: String (e.g. "09:00")
   - `gestationalAgeWeeks`: Number
   - `gestationalAgeDays`: Number
   - `birthWeightGrams`: Number
   - `currentWeightGrams`: Number
   - `weight`: Number (kg)
   - `height`: Number (cm)
   - `assignedDoctor`: String
   - `facility`: String
   - `department`: String
   - `severityState`: Enum (`normal`, `moderate`, `critical`)
   - `status`: Enum (`admitted`, `under_treatment`, `in_observation`, `discharged`)
   - `referralStatus`: Enum (`none`, `pending`, `accepted`, `rejected`, `admitted`)
   - `initialValue`: Number
   - `dischargeValue`: Number
   - `registeredBy`: ObjectId -> `users`
   - `createdAt`, `updatedAt`: Date

2. **`bilirubinreadings`**:
   - `_id`: ObjectId
   - `clientOperationId`: String (unique, indexed) — For idempotent operation tracking
   - `babyId`: String / ObjectId (indexed)
   - `babyUhid`: String (indexed)
   - `value`: Number (precision to 1 decimal place, e.g. 10.0)
   - `valueMgDl`: Number
   - `unit`: Enum (`mg/dL`, `µmol/L`)
   - `method`: Enum (`TSB`, `TcB`)
   - `postnatalAgeHours`: Number
   - `bhutaniZone`: Enum (`low`, `low_intermediate`, `high_intermediate`, `high`, `ineligible`)
   - `bhutaniPercentileApprox`: Number
   - `phototherapyPhase`: Enum (`pre_phototherapy`, `during_phototherapy`, `post_phototherapy`, `none`)
   - `measurementSite`: Enum (`forehead`, `sternum`, `palms_and_soles`, `abdomen`, `face`)
   - `source`: Enum (`manual_entry`, `device_transcutaneous`, `serum_lab`, `hospital_pt_tracker`)
   - `operatorName`: String
   - `symptoms`: String
   - `riskLevel`: Enum (`low`, `intermediate`, `high`)
   - `timestamp`: Date (indexed)
   - `sampleTimestamp`: Date
   - `isInitial`: Boolean
   - `isDischarge`: Boolean
   - `createdAt`, `updatedAt`: Date

3. **`observations`**:
   - `_id`: ObjectId
   - `clientOperationId`: String (unique, indexed)
   - `babyId`: ObjectId -> `babies` (indexed)
   - `observedBy`: ObjectId -> `users`
   - `observerName`: String
   - `site`: String (e.g. `Forehead`, `Sternum`, `Face`, `Palms and soles`)
   - `clinicalNotes`: String
   - `bilirubinValue`: Number
   - `timestamp`: Date (indexed)
   - `createdAt`, `updatedAt`: Date

4. **`users`**:
   - `_id`: ObjectId
   - `email`: String (unique, indexed)
   - `password`: String (bcrypt hashed)
   - `name`: String
   - `role`: Enum (`doctor_referring`, `receiving_hospital`, `district_admin`, `doctor`, `nurse`, `admin`)
   - `department`: String
   - `facility`: String
   - `isActive`: Boolean
   - `createdAt`, `updatedAt`: Date

5. **`hospitals`**:
   - `_id`: ObjectId
   - `name`: String
   - `code`: String (unique, indexed)
   - `type`: Enum (`receiving_hospital`, `referring_centre`)
   - `district`: String
   - `address`: String
   - `contactNumber`: String
   - `totalPTStations`: Number
   - `operationalPTStations`: Number
   - `occupiedPTStations`: Number
   - `availablePTStations`: Number

6. **`ptstations`**:
   - `_id`: ObjectId
   - `stationId`: String (unique, indexed)
   - `hospitalId`: ObjectId -> `hospitals`
   - `stationName`: String
   - `deviceModel`: String
   - `lightSource`: String
   - `irradianceMwCm2`: Number
   - `status`: Enum (`available`, `occupied`, `cleaning_prep`, `maintenance`)

7. **`referrals`**:
   - `_id`: ObjectId
   - `referralId`: String (unique, indexed)
   - `babyId`: String
   - `babyName`: String
   - `babyUhid`: String
   - `referringDoctorName`: String
   - `referringCentreName`: String
   - `receivingHospitalId`: ObjectId -> `hospitals`
   - `status`: Enum (`pending`, `accepted`, `rejected`, `cancelled`, `completed`)
   - `urgency`: Enum (`routine`, `urgent`, `emergency`)
   - `clinicalSummary`: String
   - `latestBilirubinValue`: Number

8. **`capacityreservations`**:
   - `_id`: ObjectId
   - `referralId`: String
   - `hospitalId`: ObjectId -> `hospitals`
   - `status`: Enum (`active`, `expired`, `fulfilled`, `released`)
   - `expiresAt`: Date

9. **`recommendations`**:
   - `_id`: ObjectId
   - `babyId`: ObjectId -> `babies`
   - `suggestedAction`: String
   - `frequency`: String
   - `guidelineReference`: String
   - `status`: String

10. **`notifications`**:
    - `_id`: ObjectId
    - `title`: String
    - `message`: String
    - `type`: String
    - `relatedBabyUhid`: String
    - `isRead`: Boolean

11. **`devices`**:
    - `_id`: ObjectId
    - `serialNumber`: String (unique)
    - `model`: String
    - `status`: String

12. **`stationavailabilityhistories`**:
    - `_id`: ObjectId
    - `stationId`: String
    - `previousStatus`: String
    - `newStatus`: String
    - `timestamp`: Date
