# BILISURE — Neonatal Bilirubin Care Management Application
## React Native CLI + Expo Development Server Integration

BiliSURE is a full-stack, offline-first mobile healthcare platform designed for transcutaneous neonatal bilirubin monitoring, jaundice risk assessment, phototherapy recommendations, and discharge tracking.

The mobile interface is reproduced directly from the physical prototype demonstration video (`bilisure app.mp4`).

---

## 1. System Architecture & Tech Stack

### Mobile Application
- **Architecture:** React Native CLI with Expo Modules (`install-expo-modules`) and Expo Development Client (`expo-dev-client`).
- **Development Server:** Expo CLI (`npx expo start`) with Metro Bundler.
- **Expo SDK Version:** `~52.0.0` (matching React Native `0.76.9` and React `18.3.1`).
- **Navigation:** React Navigation v7 with Custom Bottom Tabs and Elevated Center Action Button.
- **State Management:** Zustand (Session & Sync state) + TanStack Query (Server state & caching).
- **Offline Storage:** SQLite local database (`react-native-sqlite-storage`) with robust repository abstractions.
- **Offline Sync:** Idempotent background synchronization queue with exponential retry backoff.
- **UI & Graphics:** Native styling matching BiliSURE purple identity (`#7C3AED`), SVG wave spline charts, and multi-colored donut analytics.
- **Native Android:** Accessible Kotlin native project (`mobile/android/`) with `ReactNativeHostWrapper` and `ReactActivityDelegateWrapper`. Zero unnecessary BLE permissions.

### Backend API
- **Runtime:** Node.js + Express.js with TypeScript.
- **Database:** MongoDB Atlas with Mongoose ORM, compound indexes, and strict validation.
- **Security:** JWT Access & Refresh token rotation, bcryptjs password hashing, helmet, CORS, rate limiting.
- **Offline Batch Processing:** `/api/v1/sync/batch` endpoint ensuring zero duplicate medical readings.

---

## 2. Implemented Screens (Catalogued from Video)

| Screen ID | Name | Description |
|---|---|---|
| **SCR-01** | Splash Screen | Deep purple background with radial glow and bold white wordmark. |
| **SCR-02** | Onboarding Walkthrough | 3D treatment plan clipboard illustration ("Planning ahead"). |
| **SCR-03** | Register Patient | Quick admission form (Name, UHID, Weight, Height, Doctor, Severity). |
| **SCR-04** | Dashboard / Home | Department selector ("Deppt"), "See Report >" banner, Today/Yesterday lists with baby status pills, bottom navigation. |
| **SCR-05** | New Registration | Coral header, Facility dropdown, Doctor dropdown, Repeat toggle, dashed attachment box, and submission. |
| **SCR-06** | Registration Confirmation | Green checkmark badge, "The Kiddo has been registered!!!", UHID, and "Let's go" navigation. |
| **SCR-07** | Present Bilirubin Value | Solid purple hero, prominent reading value (10.0 mg/dL), Palms and soles site, symptoms input, and history accordion. |
| **SCR-08** | Clinical Risk Assessment | Solid purple screen, "Risk level: Low" in bright green, and AAP clinical reference text. |
| **SCR-09** | Recommendations | Dual recommendation cards: BiliSURE automated advice and attending provider orders. |
| **SCR-10** | Patient Trends & Detail | Baby dropdown, Initial Value (10.0 g/dL), Discharge Value (5.0 g/dL), SVG wave spline chart (1hr, 8hr, 16hr, 24hr filters), recent observations card. |
| **SCR-11** | Insights Story Carousel | Full-screen story cards with progress bars (Vacant phototherapy stations, healthy kiddos sent, transfusion alerts). |
| **SCR-12** | Summary Total & Analytics | Donut chart ("Total Infants"), Total / Admits toggle, category progress bars (Observation, Phototherapy, Critical). |
| **SCR-13** | Device Calibration | Auto Calibrate, Accuracy Test, Calibration Log toggles, 3D sensor grid graphic. |
| **SCR-14** | Calibration Status | Emerald screen ("The device is calibrated you are good to go"), remaining test progress bar (7500 of 14000). |
| **SCR-15** | Alert Diagnostics | "Something seems broken: 10", "Sorry! No more tests can be performed", Contact Support button. |
| **SCR-16** | Data Export | Form dropdowns for export category, date range, and CSV generation. |

---

## 3. Development Workflow

### Terminal 1 — Backend API
```bash
cd backend
npm run dev
```
The Express backend starts on port `5000` with endpoints mounted under `http://localhost:5000/api/v1`.

### Terminal 2 — Mobile Expo Development Server
```bash
cd mobile
npx expo start
```
Or start with a clean cache:
```bash
npm run start:clear
```

### Terminal 3 — Android Development Client Build
To install and launch the development client on an Android emulator or connected physical device:
```bash
cd mobile
npx expo run:android
```
*Note: Once the development client is installed on your Android device, you only need to run `npx expo start` to test JS/TS changes live.*

---

## 4. Connecting a Physical Android Phone

1. **Install Development Client:** Run `npx expo run:android` with your phone connected via USB debugging (or install the built debug APK).
2. **Start Expo Server:** Run `npx expo start`.
3. **Connect to Same Wi-Fi:** Ensure your phone and development computer are connected to the same local network.
4. **Scan QR Code:** Open your phone camera or the installed BiliSURE app and scan the QR code displayed in the terminal.
5. **Backend URL:** The mobile app automatically detects your computer's LAN IP from `Constants.expoConfig.hostUri` and connects to `http://<your-lan-ip>:5000/api/v1`. If testing across different subnets, run `npx expo start --tunnel`.

---

## 5. Verification Commands

- **TypeScript Validation:**
  ```bash
  cd mobile && npm run typecheck
  ```
- **Backend Integration Tests (10/10 Passed):**
  ```bash
  cd backend && npm run test
  ```
- **Metro Android Bundler Test:**
  ```bash
  cd mobile && npx expo export:embed --platform android --dev false --entry-file index.js --bundle-output dist/bundle.js --assets-dest dist/assets
  ```
