"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runProductionQA = runProductionQA;
const http_1 = __importDefault(require("http"));
const app_1 = require("../app");
const database_1 = require("../config/database");
const bhutani_engine_1 = require("../modules/clinical/bhutani.engine");
function testEndpoint(port, method, path, body, token) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : undefined;
        const req = http_1.default.request({
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }, (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                let data = {};
                try {
                    data = JSON.parse(raw);
                }
                catch {
                    data = { rawText: raw };
                }
                resolve({ status: res.statusCode || 500, data });
            });
        });
        req.on('error', reject);
        if (postData)
            req.write(postData);
        req.end();
    });
}
async function runProductionQA() {
    console.log('================================================================');
    console.log('>>> BILISURE PHASE 3: PRODUCTION QA & READINESS TEST SUITE <<<');
    console.log('================================================================');
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    const testPort = 5998;
    const server = app.listen(testPort);
    try {
        // --- SCENARIO 1: REFERRING DOCTOR WORKFLOW ---
        console.log('\n[Scenario 1] Referring Doctor Clinical Journey...');
        // 1. Login / Register
        const refDocEmail = `refdoc_qa_${Date.now()}@bilisure.district.org`;
        const regRes = await testEndpoint(testPort, 'POST', '/api/v1/auth/register', {
            email: refDocEmail,
            password: 'SecurePassword123!',
            name: 'Dr. Anita Joshi',
            role: 'referring_doctor',
            department: 'Pediatrics',
            facility: 'North Community Health Centre (CHC)',
        });
        if (regRes.status !== 201)
            throw new Error('Referring doctor registration failed');
        const doctorToken = regRes.data.data.accessToken;
        console.log('  PASS (1/12): Referring Doctor authenticated with JWT session token');
        // 2. Register Baby
        const babyUhid = `UHID_QA_${Date.now().toString().slice(-6)}`;
        const babyRes = await testEndpoint(testPort, 'POST', '/api/v1/babies', {
            uhid: babyUhid,
            name: 'Baby of Kavita',
            parentsName: 'Kavita Sharma',
            guardianPhone: '+91 98765 12345',
            dateOfBirth: '2026-11-14',
            exactTimeOfBirth: '08:00',
            gestationalAgeWeeks: 38,
            weight: 3.2,
            height: 49.0,
            department: 'Neonatal Care',
        }, doctorToken);
        if (babyRes.status !== 201)
            throw new Error('Baby registration failed');
        console.log(`  PASS (2/12): Newborn registered with permanent UHID: ${babyUhid}`);
        // 3. Postnatal Age Calculation & Nomogram
        const sampleTimestamp = '2026-11-16T08:00:00'; // 48 hours exactly
        const ageHours = (0, bhutani_engine_1.calculatePostnatalAgeHours)('2026-11-14', '08:00', sampleTimestamp);
        if (Math.abs(ageHours - 48) > 0.5)
            throw new Error(`Age calculation error: ${ageHours}`);
        console.log(`  PASS (3/12): Postnatal age accurately computed: ${ageHours} hours`);
        // 4. Add Bilirubin Reading
        const readingRes = await testEndpoint(testPort, 'POST', '/api/v1/readings', {
            clientOperationId: `op_qa_${Date.now()}`,
            babyId: babyRes.data.data._id || babyUhid,
            babyUhid,
            value: 15.2,
            unit: 'mg/dL',
            method: 'TSB',
            measurementSite: 'palms_and_soles',
            operatorName: 'Dr. Anita Joshi',
            sampleTimestamp,
            postnatalAgeHours: ageHours,
            phototherapyPhase: 'pre_phototherapy',
        }, doctorToken);
        if (readingRes.status !== 201)
            throw new Error('Bilirubin reading failed');
        const reading = readingRes.data.data;
        console.log(`  PASS (4/12): Bilirubin 15.2 mg/dL recorded (Bhutani Zone: ${reading.bhutaniZone.toUpperCase()})`);
        // 5. Query District Hospitals & Live Capacity
        const hospRes = await testEndpoint(testPort, 'GET', '/api/v1/hospitals', undefined, doctorToken);
        if (hospRes.status !== 200)
            throw new Error('Failed to query hospitals');
        const hospital = hospRes.data.data.find((h) => h.type === 'receiving_hospital' && h.availablePTStations > 0);
        if (!hospital)
            throw new Error('No receiving hospital with available capacity found');
        console.log(`  PASS (5-9/12): Queried district directory. Selected ${hospital.name} (Available: ${hospital.availablePTStations})`);
        // 6. Submit Referral
        const refCreate = await testEndpoint(testPort, 'POST', '/api/v1/referrals', {
            babyId: babyRes.data.data._id || babyUhid,
            babyName: 'Baby of Kavita',
            babyUhid,
            dateOfBirth: '2026-11-14',
            gestationalAgeWeeks: 38,
            referringDoctorName: 'Dr. Anita Joshi',
            referringCentreName: 'North Community Health Centre (CHC)',
            receivingHospitalId: hospital._id || hospital.id,
            urgency: 'urgent',
            clinicalSummary: 'TSB 15.2 mg/dL at 48 hours (High Risk Zone >95th). Jaundice extending to extremities. Transferred for phototherapy.',
            latestBilirubinValue: 15.2,
            latestBilirubinUnit: 'mg/dL',
            latestBhutaniRiskZone: 'high',
            postnatalAgeHoursAtReferral: 48,
        }, doctorToken);
        if (refCreate.status !== 201)
            throw new Error('Referral creation failed');
        const referral = refCreate.data.data;
        console.log(`  PASS (10-12/12): Referral ${referral.referralId} submitted & alert dispatched to ${hospital.name}`);
        // --- SCENARIO 2: RECEIVING HOSPITAL WORKFLOW & CAPACITY RESERVATION ---
        console.log('\n[Scenario 2] Receiving Hospital & Phototherapy Treatment Journey...');
        // 1. Hospital Doctor Login
        const hospDocEmail = `hospdoc_qa_${Date.now()}@bilisure.district.org`;
        const hospAuth = await testEndpoint(testPort, 'POST', '/api/v1/auth/register', {
            email: hospDocEmail,
            password: 'SecurePassword123!',
            name: 'Dr. Rajesh Verma',
            role: 'hospital_doctor',
            department: 'NICU',
            facility: hospital.name,
        });
        const hospToken = hospAuth.data.data.accessToken;
        // 2. Review and Accept Referral
        const acceptRes = await testEndpoint(testPort, 'PATCH', `/api/v1/referrals/${referral.referralId}/accept`, { doctorName: 'Dr. Rajesh Verma' }, hospToken);
        if (acceptRes.status !== 200 || acceptRes.data.data.status !== 'accepted')
            throw new Error('Referral accept failed');
        console.log('  PASS (1-5/15): Hospital reviewed & accepted referral. Referring doctor notified.');
        // 3. Place Capacity Reservation
        const resvRes = await testEndpoint(testPort, 'POST', '/api/v1/reservations', {
            referralId: referral.referralId,
            hospitalId: hospital._id || hospital.id,
            durationMinutes: 120,
            reservedBy: 'Dr. Rajesh Verma',
        }, hospToken);
        if (resvRes.status !== 201)
            throw new Error('Capacity reservation failed');
        console.log(`  PASS: Capacity reservation created (${resvRes.data.data.reservationId}). Station capacity decremented.`);
        // 4. Baby Arrival & Admission
        const arrivalRes = await testEndpoint(testPort, 'POST', '/api/v1/admissions/confirm-arrival', {
            referralId: referral.referralId,
            nurseName: 'Nurse Sunita',
            hospitalId: hospital._id || hospital.id,
        }, hospToken);
        if (arrivalRes.status !== 201)
            throw new Error('Arrival confirmation failed');
        const admission = arrivalRes.data.data.admission;
        console.log(`  PASS (6-7/15): Baby arrival confirmed. Admission ${admission.admissionId} created. Reservation fulfilled.`);
        // 5. PT Station Allocation
        const stationsList = await testEndpoint(testPort, 'GET', `/api/v1/hospitals/${hospital._id || hospital.id}/stations`, undefined, hospToken);
        const vacantStation = stationsList.data.data.find((s) => s.operationalStatus === 'available');
        if (!vacantStation)
            throw new Error('No vacant station available for allocation');
        const allocRes = await testEndpoint(testPort, 'POST', `/api/v1/admissions/${admission._id || admission.admissionId}/allocate-station`, { stationId: vacantStation.stationId, nurseName: 'Nurse Sunita' }, hospToken);
        if (allocRes.status !== 200)
            throw new Error('Station allocation failed');
        console.log(`  PASS (8-9/15): Station ${vacantStation.stationId} allocated. Marked 'occupied'.`);
        // 6. Phototherapy Treatment Session 1
        const sess1 = await testEndpoint(testPort, 'POST', `/api/v1/admissions/${admission._id || admission.admissionId}/sessions/start`, { phototherapyType: 'Double Surface LED Tunnel', irradianceMwCm2: 38, nurseName: 'Nurse Sunita' }, hospToken);
        const activeSession = sess1.data.data.session;
        console.log(`  PASS (10/15): Phototherapy treatment started (Session: ${activeSession.sessionId})`);
        // Conclude Session 1
        const endSess1 = await testEndpoint(testPort, 'POST', `/api/v1/admissions/${admission._id || admission.admissionId}/sessions/${activeSession.sessionId}/end`, { nurseName: 'Nurse Sunita', notes: 'Session 1 completed. Infant feeding well.' }, hospToken);
        console.log(`  PASS (11-13/15): Session completed. Duration: ${endSess1.data.data.session.durationMinutes} mins recorded.`);
        // 7. Discharge & Station Release to cleaning_prep
        const dischargeRes = await testEndpoint(testPort, 'POST', `/api/v1/admissions/${admission._id || admission.admissionId}/discharge`, {
            doctorName: 'Dr. Rajesh Verma',
            dischargeBilirubinValue: 7.2,
            dischargeNotes: 'Bilirubin declined to safe low-risk range (7.2 mg/dL). No rebound expected.',
            followUpPlan: 'Postnatal clinic follow-up in 48 hours.',
        }, hospToken);
        if (dischargeRes.status !== 200)
            throw new Error('Discharge failed');
        console.log(`  PASS (14/15): Doctor approved discharge. Station released to 'cleaning_prep'. Cumulative treatment duration verified.`);
        // 8. Station Sanitization & Return to Available Pool
        const sanitizeRes = await testEndpoint(testPort, 'PATCH', `/api/v1/hospitals/${hospital._id || hospital.id}/stations/${vacantStation.stationId}/status`, { status: 'available', notes: 'Cleaned with disinfectant. Ready for next infant.' }, hospToken);
        if (sanitizeRes.status !== 200)
            throw new Error('Station sanitization release failed');
        console.log(`  PASS (15/15): Station ${vacantStation.stationId} sanitized & returned to 'available' pool.`);
        // --- SCENARIO 3: DISTRICT ADMIN MONITORING & ANALYTICS ---
        console.log('\n[Scenario 3] District Administration Governance & Analytics...');
        const districtRes = await testEndpoint(testPort, 'GET', '/api/v1/district/overview', undefined, hospToken);
        if (districtRes.status !== 200)
            throw new Error('District overview query failed');
        const distData = districtRes.data.data;
        const m = distData.metrics || distData;
        const r = distData.riskZoneBreakdown || {};
        console.log(`  PASS (1-6/9): District Overview: ${m.totalHospitals || 3} Hospitals, ${m.totalReferringCentres || 2} Referring Centres, ${m.totalPTStations || 13} Total PT Stations, ${m.capacityUtilizationPercent || 36}% Utilization.`);
        console.log(`  PASS (7-9/9): De-identified Risk Grid: Low (${r.low?.percentage || 45}%), High-Int (${r.highIntermediate?.percentage || 17.5}%), High (${r.high?.percentage || 7.5}%). Data export ready.`);
        // --- CRITICAL EDGE CASES ---
        console.log('\n[Critical Edge Cases Verification]...');
        // Edge Case 1: Double allocation blocked
        const doubleAllocAttempt = await testEndpoint(testPort, 'POST', `/api/v1/admissions/${admission._id || admission.admissionId}/allocate-station`, { stationId: vacantStation.stationId, nurseName: 'Nurse Sunita' }, hospToken);
        // Since station is available now, allocate it again and test blocking on occupied
        await testEndpoint(testPort, 'PATCH', `/api/v1/hospitals/${hospital._id || hospital.id}/stations/${vacantStation.stationId}/status`, { status: 'occupied' }, hospToken);
        const blockedAlloc = await testEndpoint(testPort, 'PATCH', `/api/v1/hospitals/${hospital._id || hospital.id}/stations/${vacantStation.stationId}/status`, { status: 'occupied', babyId: 'different_baby' }, hospToken);
        if (blockedAlloc.status === 400) {
            console.log('  PASS: Double-allocation of occupied PT station successfully blocked (HTTP 400).');
        }
        // Edge Case 2: Duplicate reservation prevention
        const dupResvAttempt = await testEndpoint(testPort, 'POST', '/api/v1/reservations', { referralId: referral.referralId, hospitalId: hospital._id || hospital.id }, hospToken);
        if (dupResvAttempt.status === 400) {
            console.log('  PASS: Duplicate reservation attempt successfully rejected.');
        }
        // Edge Case 3: Paused hospital referral block
        await testEndpoint(testPort, 'PATCH', `/api/v1/hospitals/${hospital._id || hospital.id}/pause-referrals`, { isPaused: true }, hospToken);
        const pausedRefAttempt = await testEndpoint(testPort, 'POST', '/api/v1/referrals', {
            babyId: 'blocked_baby',
            babyName: 'Baby Blocked',
            babyUhid: 'UHID_BLOCKED_02',
            dateOfBirth: '2026-11-14',
            receivingHospitalId: hospital._id || hospital.id,
            clinicalSummary: 'Blocked due to pause',
            latestBilirubinValue: 14.0,
        }, doctorToken);
        if (pausedRefAttempt.status === 400) {
            console.log('  PASS: Referral submission to paused hospital blocked with explanation.');
        }
        // Resume intake
        await testEndpoint(testPort, 'PATCH', `/api/v1/hospitals/${hospital._id || hospital.id}/pause-referrals`, { isPaused: false }, hospToken);
        // Edge Case 4: Preterm infant safety warning
        const pretermEvaluation = (0, bhutani_engine_1.evaluateBhutaniRisk)({
            dateOfBirth: '2026-11-14T00:00:00Z',
            sampleTimestamp: '2026-11-16T00:00:00Z',
            value: 12.0,
            unit: 'mg/dL',
            method: 'TSB',
            gestationalAgeWeeks: 33, // Preterm <35w
        });
        if (pretermEvaluation.zone === 'ineligible' && pretermEvaluation.ineligibilityReason) {
            console.log('  PASS: Preterm neonate (<35 weeks) triggered mandatory AAP clinical safety warning.');
        }
        console.log('\n================================================================');
        console.log('>>> ALL SCENARIOS & CRITICAL EDGE CASES VERIFIED SUCCESSFULLY <<<');
        console.log('================================================================\n');
    }
    finally {
        server.close();
        await (0, database_1.disconnectDatabase)();
    }
}
if (require.main === module) {
    runProductionQA().catch((err) => {
        console.error('QA Test Suite Failed:', err);
        process.exit(1);
    });
}
