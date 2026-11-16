"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsService = void 0;
const Hospital_1 = require("../../models/Hospital");
const PTStation_1 = require("../../models/PTStation");
const database_1 = require("../../config/database");
const errors_1 = require("../../common/errors");
// Fast in-memory state fallback when detached or testing
const memoryHospitals = [];
const memoryStations = [];
// Initial Seed Data for District Network
const SEED_HOSPITALS = [
    {
        _id: 'hosp_001',
        name: 'District Civil Hospital',
        code: 'DCH-01',
        type: 'receiving_hospital',
        district: 'Central District',
        address: 'Civil Lines, Main Medical Road',
        contactNumber: '+91-98765-11001',
        totalPTStations: 6,
        operationalPTStations: 5,
        occupiedPTStations: 2,
        availablePTStations: 3,
        lastAvailabilityUpdated: new Date(),
    },
    {
        _id: 'hosp_002',
        name: 'Mother & Child Apex Hospital',
        code: 'MCAH-02',
        type: 'receiving_hospital',
        district: 'Central District',
        address: 'Sector 4, Healthcare Enclave',
        contactNumber: '+91-98765-11002',
        totalPTStations: 4,
        operationalPTStations: 4,
        occupiedPTStations: 1,
        availablePTStations: 3,
        lastAvailabilityUpdated: new Date(),
    },
    {
        _id: 'hosp_003',
        name: 'St. Jude Neonatal Care Centre',
        code: 'SJNC-03',
        type: 'receiving_hospital',
        district: 'Central District',
        address: 'Near Old Bus Stand, North Wing',
        contactNumber: '+91-98765-11003',
        totalPTStations: 3,
        operationalPTStations: 2,
        occupiedPTStations: 1,
        availablePTStations: 1,
        lastAvailabilityUpdated: new Date(),
    },
    {
        _id: 'ref_001',
        name: 'North Community Health Centre (CHC)',
        code: 'NCHC-01',
        type: 'referring_centre',
        district: 'Central District',
        address: 'Village Rampur, North Block',
        contactNumber: '+91-98765-22001',
        totalPTStations: 0,
        operationalPTStations: 0,
        occupiedPTStations: 0,
        availablePTStations: 0,
        lastAvailabilityUpdated: new Date(),
    },
    {
        _id: 'ref_002',
        name: 'East Primary Health Centre (PHC)',
        code: 'EPHC-02',
        type: 'referring_centre',
        district: 'Central District',
        address: 'East Bypass Road',
        contactNumber: '+91-98765-22002',
        totalPTStations: 0,
        operationalPTStations: 0,
        occupiedPTStations: 0,
        availablePTStations: 0,
        lastAvailabilityUpdated: new Date(),
    },
];
const SEED_STATIONS = [
    // District Civil Hospital (6 stations: 2 occupied, 3 available, 1 maintenance)
    {
        _id: 'st_dch_01',
        stationId: 'PT-DCH-01',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'Double LED Tunnel A1',
        type: 'led_tunnel',
        location: 'NICU Bed 1',
        operationalStatus: 'occupied',
        currentBabyId: '651a00010000000000000001',
        currentBabyName: 'Baby 1',
        currentBabyUhid: 'M1A2N3S4I5',
        lastCleanedAt: new Date(Date.now() - 3600000 * 24),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_dch_02',
        stationId: 'PT-DCH-02',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'Double Surface LED A2',
        type: 'double_surface',
        location: 'NICU Bed 2',
        operationalStatus: 'occupied',
        currentBabyId: '651a00010000000000000002',
        currentBabyName: 'Baby 2',
        currentBabyUhid: 'B9C8D7E6F5',
        lastCleanedAt: new Date(Date.now() - 3600000 * 18),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_dch_03',
        stationId: 'PT-DCH-03',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'Overhead Blue LED A3',
        type: 'single_surface',
        location: 'NICU Bed 3',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(Date.now() - 3600000 * 4),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_dch_04',
        stationId: 'PT-DCH-04',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'BiliBed Fiberoptic A4',
        type: 'fiberoptic_blanket',
        location: 'NICU Bed 4',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(Date.now() - 3600000 * 2),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_dch_05',
        stationId: 'PT-DCH-05',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'Double Surface LED A5',
        type: 'double_surface',
        location: 'SNCU Bed 1',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(Date.now() - 3600000 * 1),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_dch_06',
        stationId: 'PT-DCH-06',
        hospitalId: 'hosp_001',
        hospitalName: 'District Civil Hospital',
        name: 'Overhead Blue LED A6',
        type: 'single_surface',
        location: 'SNCU Bed 2',
        operationalStatus: 'maintenance',
        currentBabyId: null,
        notes: 'Lamp sensor replacement scheduled',
        lastCleanedAt: new Date(Date.now() - 3600000 * 48),
        lastUpdated: new Date(),
    },
    // Mother & Child Apex Hospital (4 stations: 1 occupied, 3 available)
    {
        _id: 'st_mcah_01',
        stationId: 'PT-MCAH-01',
        hospitalId: 'hosp_002',
        hospitalName: 'Mother & Child Apex Hospital',
        name: 'LED Intensive Phototherapy Tunnel 1',
        type: 'led_tunnel',
        location: 'NICU Stepdown Bed 1',
        operationalStatus: 'occupied',
        currentBabyId: '651a00010000000000000003',
        currentBabyName: 'Baby 3',
        currentBabyUhid: 'K1L2M3N4P5',
        lastCleanedAt: new Date(Date.now() - 3600000 * 12),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_mcah_02',
        stationId: 'PT-MCAH-02',
        hospitalId: 'hosp_002',
        hospitalName: 'Mother & Child Apex Hospital',
        name: 'Double Surface BiliCradle 2',
        type: 'double_surface',
        location: 'NICU Stepdown Bed 2',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_mcah_03',
        stationId: 'PT-MCAH-03',
        hospitalId: 'hosp_002',
        hospitalName: 'Mother & Child Apex Hospital',
        name: 'Overhead Blue LED Unit 3',
        type: 'single_surface',
        location: 'Postnatal Ward 4',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(),
        lastUpdated: new Date(),
    },
    {
        _id: 'st_mcah_04',
        stationId: 'PT-MCAH-04',
        hospitalId: 'hosp_002',
        hospitalName: 'Mother & Child Apex Hospital',
        name: 'Fiberoptic Phototherapy Blanket 4',
        type: 'fiberoptic_blanket',
        location: 'Postnatal Ward 5',
        operationalStatus: 'available',
        currentBabyId: null,
        lastCleanedAt: new Date(),
        lastUpdated: new Date(),
    },
];
// Seed memory if empty
if (memoryHospitals.length === 0) {
    memoryHospitals.push(...SEED_HOSPITALS);
    memoryStations.push(...SEED_STATIONS);
}
class HospitalsService {
    /**
     * Recalculate capacity: Available = Operational - Occupied
     */
    static async refreshCapacity(hospitalId) {
        const stations = await this.getStations(hospitalId);
        const total = stations.length;
        const operational = stations.filter((s) => s.operationalStatus !== 'maintenance' && s.operationalStatus !== 'out_of_service').length;
        const occupied = stations.filter((s) => s.operationalStatus === 'occupied').length;
        const available = Math.max(0, operational - occupied);
        if (database_1.isMongoConnected) {
            await Hospital_1.HospitalModel.findByIdAndUpdate(hospitalId, {
                totalPTStations: total,
                operationalPTStations: operational,
                occupiedPTStations: occupied,
                availablePTStations: available,
                lastAvailabilityUpdated: new Date(),
            }).catch(() => null);
        }
        const memHosp = memoryHospitals.find((h) => h._id === hospitalId || h.id === hospitalId);
        if (memHosp) {
            memHosp.totalPTStations = total;
            memHosp.operationalPTStations = operational;
            memHosp.occupiedPTStations = occupied;
            memHosp.availablePTStations = available;
            memHosp.lastAvailabilityUpdated = new Date();
        }
        return { total, operational, occupied, available };
    }
    static async listHospitals(type) {
        if (database_1.isMongoConnected) {
            try {
                const query = {};
                if (type)
                    query.type = type;
                const list = await Hospital_1.HospitalModel.find(query).sort({ availablePTStations: -1 });
                if (list.length > 0)
                    return list;
            }
            catch { }
        }
        let filtered = memoryHospitals;
        if (type) {
            filtered = filtered.filter((h) => h.type === type);
        }
        return filtered;
    }
    static async getHospitalById(id) {
        if (database_1.isMongoConnected) {
            try {
                const hosp = await Hospital_1.HospitalModel.findById(id);
                if (hosp)
                    return hosp;
            }
            catch { }
        }
        const found = memoryHospitals.find((h) => h._id === id || h.id === id);
        if (!found)
            throw new errors_1.NotFoundError('Hospital not found');
        return found;
    }
    static async getStations(hospitalId) {
        if (database_1.isMongoConnected) {
            try {
                const list = await PTStation_1.PTStationModel.find({ hospitalId }).sort({ stationId: 1 });
                if (list.length > 0)
                    return list;
            }
            catch { }
        }
        return memoryStations.filter((s) => String(s.hospitalId) === String(hospitalId));
    }
    static async createStation(data) {
        const hospital = await this.getHospitalById(data.hospitalId);
        // Double check stationId uniqueness in this hospital
        const existing = memoryStations.find((s) => String(s.hospitalId) === String(data.hospitalId) && s.stationId === data.stationId.toUpperCase());
        if (existing) {
            throw new errors_1.BadRequestError(`Station ID ${data.stationId} already exists in ${hospital.name}`);
        }
        const newStation = {
            _id: 'st_' + Date.now(),
            stationId: data.stationId.toUpperCase(),
            hospitalId: data.hospitalId,
            hospitalName: hospital.name,
            name: data.name,
            type: data.type || 'double_surface',
            location: data.location || 'NICU Ward',
            operationalStatus: 'available',
            currentBabyId: null,
            notes: data.notes || '',
            lastCleanedAt: new Date(),
            lastUpdated: new Date(),
        };
        if (database_1.isMongoConnected) {
            try {
                await PTStation_1.PTStationModel.create(newStation);
            }
            catch { }
        }
        memoryStations.push(newStation);
        await this.refreshCapacity(data.hospitalId);
        return newStation;
    }
    static async updateStationStatus(stationId, status, meta) {
        const station = memoryStations.find((s) => String(s._id) === String(stationId) || s.stationId === stationId);
        if (!station)
            throw new errors_1.NotFoundError('PT Station not found');
        // Rule: Double allocation prevention!
        if (status === 'occupied' && station.operationalStatus === 'occupied') {
            if (meta?.babyId && station.currentBabyId && String(station.currentBabyId) !== String(meta.babyId)) {
                throw new errors_1.BadRequestError(`Station ${station.stationId} is already occupied by ${station.currentBabyName || 'another patient'}`);
            }
        }
        // Rule: Out of service / maintenance cannot be allocated
        if (status === 'occupied' && (station.operationalStatus === 'maintenance' || station.operationalStatus === 'out_of_service')) {
            throw new errors_1.BadRequestError(`Station ${station.stationId} is currently under ${station.operationalStatus} and cannot be occupied.`);
        }
        station.operationalStatus = status;
        station.lastUpdated = new Date();
        if (status === 'occupied') {
            station.currentBabyId = meta?.babyId || station.currentBabyId;
            station.currentBabyName = meta?.babyName || station.currentBabyName;
            station.currentBabyUhid = meta?.babyUhid || station.currentBabyUhid;
            station.allocatedAt = new Date();
        }
        else if (status === 'cleaning_prep') {
            // Releasing station after patient discharge
            station.currentBabyId = null;
            station.currentBabyName = null;
            station.currentBabyUhid = null;
            station.allocatedAt = null;
        }
        else if (status === 'available') {
            station.currentBabyId = null;
            station.currentBabyName = null;
            station.currentBabyUhid = null;
            station.allocatedAt = null;
            station.lastCleanedAt = new Date();
        }
        if (meta?.notes !== undefined) {
            station.notes = meta.notes;
        }
        if (database_1.isMongoConnected) {
            try {
                await PTStation_1.PTStationModel.findByIdAndUpdate(station._id, station);
            }
            catch { }
        }
        await this.refreshCapacity(String(station.hospitalId));
        return station;
    }
    static async togglePauseReferrals(hospitalId, isPaused, reason) {
        const hospital = await this.getHospitalById(hospitalId);
        hospital.isReferralPaused = isPaused;
        hospital.pauseReason = reason || (isPaused ? 'Temporarily paused by clinical department' : undefined);
        hospital.lastAvailabilityUpdated = new Date();
        if (database_1.isMongoConnected) {
            try {
                await Hospital_1.HospitalModel.findByIdAndUpdate(hospital._id, hospital);
            }
            catch { }
        }
        return hospital;
    }
}
exports.HospitalsService = HospitalsService;
