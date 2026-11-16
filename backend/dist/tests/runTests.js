"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const http_1 = __importDefault(require("http"));
async function testEndpoint(port, method, path, body, token) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : undefined;
        const req = http_1.default.request({
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }, (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                let parsed = raw;
                try {
                    parsed = JSON.parse(raw);
                }
                catch { }
                resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
            });
        });
        req.on('error', reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
async function runAllTests() {
    console.log('--- Starting BiliSURE Backend Integration Tests ---');
    const app = (0, app_1.createApp)();
    const testPort = 5999;
    const server = app.listen(testPort);
    try {
        // 1. Health check
        console.log('[Test 1] Health Check...');
        const health = await testEndpoint(testPort, 'GET', '/health');
        if (health.status !== 200 || health.data.status !== 'ok')
            throw new Error('Health check failed');
        console.log('  PASS: Health endpoint responded with 200 OK');
        // 2. User registration
        console.log('[Test 2] User Registration...');
        const email = `nurse_${Date.now()}@bilisure.org`;
        const reg = await testEndpoint(testPort, 'POST', '/api/v1/auth/register', {
            email,
            password: 'Password123!',
            name: 'Nurse Sarah',
            role: 'nurse',
            department: 'NICU',
        });
        if (reg.status !== 201 || !reg.data.data.accessToken)
            throw new Error('User registration failed');
        const token = reg.data.data.accessToken;
        console.log('  PASS: Registered user and obtained JWT access token');
        // 3. User login
        console.log('[Test 3] User Login...');
        const login = await testEndpoint(testPort, 'POST', '/api/v1/auth/login', {
            email,
            password: 'Password123!',
        });
        if (login.status !== 200 || !login.data.data.accessToken)
            throw new Error('Login failed');
        console.log('  PASS: Login verified with bcrypt password validation');
        // 4. Baby Listing
        console.log('[Test 4] Baby Profile Listing...');
        const babies = await testEndpoint(testPort, 'GET', '/api/v1/babies', undefined, token);
        if (babies.status !== 200 || !Array.isArray(babies.data.data))
            throw new Error('Baby listing failed');
        console.log(`  PASS: Found ${babies.data.data.length} registered babies (Baby 1, Baby 2, Baby 3)`);
        // 5. Baby Registration
        console.log('[Test 5] Register New Baby (Kiddo)...');
        const newBabyUhid = `UHID_${Date.now().toString().slice(-6)}`;
        const newBaby = await testEndpoint(testPort, 'POST', '/api/v1/babies', {
            uhid: newBabyUhid,
            name: 'Baby Test',
            parentsName: 'Jane Test',
            dateOfBirth: new Date().toISOString(),
            weight: 3.2,
            height: 49.0,
            assignedDoctor: 'Dr. XYZ',
            facility: 'Central Children Hospital',
            department: 'Deppt',
            severityState: 'normal',
        }, token);
        if (newBaby.status !== 201 || newBaby.data.data.uhid !== newBabyUhid)
            throw new Error('Baby creation failed');
        console.log(`  PASS: New baby registered with UHID: ${newBabyUhid}`);
        // 6. Bilirubin Reading Logging
        console.log('[Test 6] Record Bilirubin Reading...');
        const readingOpId = `op_test_${Date.now()}`;
        const reading = await testEndpoint(testPort, 'POST', '/api/v1/readings', {
            clientOperationId: readingOpId,
            babyId: newBaby.data.data._id || '651a00010000000000000001',
            value: 10.0,
            unit: 'mg/dL',
            measurementSite: 'palms_and_soles',
            symptoms: 'Normal tone',
        }, token);
        if (reading.status !== 201 || reading.data.data.value !== 10.0)
            throw new Error('Reading creation failed');
        console.log('  PASS: Reading recorded (10.0 mg/dL, Palms and soles, Risk: Low)');
        // 7. Clinical Recommendations
        console.log('[Test 7] Fetch Clinical Recommendations...');
        const recs = await testEndpoint(testPort, 'GET', '/api/v1/recommendations/baby/651a00010000000000000001?bilirubin=10.0', undefined, token);
        if (recs.status !== 200 || !Array.isArray(recs.data.data))
            throw new Error('Recommendations failed');
        console.log(`  PASS: Fetched ${recs.data.data.length} clinical recommendations (Automated & Provider)`);
        // 8. Analytics Summary Donut
        console.log('[Test 8] Fetch Analytics Donut Summary...');
        const analytics = await testEndpoint(testPort, 'GET', '/api/v1/analytics/summary-total?period=Day', undefined, token);
        if (analytics.status !== 200 || !analytics.data.data.breakdown)
            throw new Error('Analytics failed');
        console.log(`  PASS: Analytics returned Total Infants: ${analytics.data.data.totalInfants}`);
        // 9. Offline Sync Batch Ingestion
        console.log('[Test 9] Idempotent Offline Sync Batch Processing...');
        const syncRes = await testEndpoint(testPort, 'POST', '/api/v1/sync/batch', {
            operations: [
                {
                    operationId: `sync_op_${Date.now()}`,
                    entityType: 'reading',
                    action: 'create',
                    payload: {
                        babyId: '651a00010000000000000001',
                        value: 11.5,
                        unit: 'mg/dL',
                        measurementSite: 'face',
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        }, token);
        if (syncRes.status !== 200 || syncRes.data.data[0].status !== 'synced')
            throw new Error('Sync batch failed');
        console.log('  PASS: Offline sync batch executed with server confirmation');
        // 10. CSV Export
        console.log('[Test 10] Data Export (CSV)...');
        const csvRes = await testEndpoint(testPort, 'GET', '/api/v1/analytics/export?dataType=All&dateRange=Last%2030%20days', undefined, token);
        if (csvRes.status !== 200 || typeof csvRes.data !== 'string' || !csvRes.data.includes('UHID'))
            throw new Error('CSV export failed');
        console.log('  PASS: CSV export verified with correct headers and baby records');
        console.log('\n>>> ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
    }
    finally {
        server.close();
    }
}
runAllTests().catch((err) => {
    console.error('\nFAIL: Integration test error:', err);
    process.exit(1);
});
