import { HospitalModel, IHospital } from '../../models/Hospital';
import { PTStationModel, IPTStation, PTStationStatus, PTStationType } from '../../models/PTStation';
import { isMongoConnected } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../common/errors';

// Fast in-memory state fallback when detached or testing
const memoryHospitals: IHospital[] = [];
const memoryStations: IPTStation[] = [];

// Initial Seed Data for Hospital Network (PGI, RML, KGMU)
const SEED_HOSPITALS = [
  {
    _id: 'hosp_pgi',
    name: 'PGI',
    code: 'PGI',
    type: 'receiving_hospital' as const,
    district: 'Lucknow',
    address: 'Raebareli Road, Lucknow, Uttar Pradesh 226014',
    contactNumber: '+91-522-2668700',
    totalPTStations: 10,
    operationalPTStations: 10,
    occupiedPTStations: 0,
    availablePTStations: 10,
    lastAvailabilityUpdated: new Date(),
  },
  {
    _id: 'hosp_rml',
    name: 'RML',
    code: 'RML',
    type: 'receiving_hospital' as const,
    district: 'Lucknow',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010',
    contactNumber: '+91-522-6692000',
    totalPTStations: 10,
    operationalPTStations: 10,
    occupiedPTStations: 0,
    availablePTStations: 10,
    lastAvailabilityUpdated: new Date(),
  },
  {
    _id: 'hosp_kgmu',
    name: 'KGMU',
    code: 'KGMU',
    type: 'receiving_hospital' as const,
    district: 'Lucknow',
    address: 'Shah Mina Road, Chowk, Lucknow, Uttar Pradesh 226003',
    contactNumber: '+91-522-2257450',
    totalPTStations: 7,
    operationalPTStations: 7,
    occupiedPTStations: 0,
    availablePTStations: 7,
    lastAvailabilityUpdated: new Date(),
  },
];

const SEED_STATIONS = [
  // PGI (10 stations: BED 10 to BED 100)
  { _id: 'st_pgi_10', stationId: 'PT-PGI-10', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 10', type: 'led_tunnel' as PTStationType, location: 'NICU Bed 10', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_20', stationId: 'PT-PGI-20', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 20', type: 'double_surface' as PTStationType, location: 'NICU Bed 20', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_30', stationId: 'PT-PGI-30', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 30', type: 'single_surface' as PTStationType, location: 'NICU Bed 30', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_40', stationId: 'PT-PGI-40', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 40', type: 'fiberoptic_blanket' as PTStationType, location: 'NICU Bed 40', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_50', stationId: 'PT-PGI-50', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 50', type: 'double_surface' as PTStationType, location: 'NICU Bed 50', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_60', stationId: 'PT-PGI-60', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 60', type: 'single_surface' as PTStationType, location: 'NICU Bed 60', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_70', stationId: 'PT-PGI-70', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 70', type: 'led_tunnel' as PTStationType, location: 'SNCU Bed 70', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_80', stationId: 'PT-PGI-80', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 80', type: 'double_surface' as PTStationType, location: 'SNCU Bed 80', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_90', stationId: 'PT-PGI-90', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 90', type: 'single_surface' as PTStationType, location: 'SNCU Bed 90', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_pgi_100', stationId: 'PT-PGI-100', hospitalId: 'hosp_pgi', hospitalName: 'PGI', name: 'BED 100', type: 'fiberoptic_blanket' as PTStationType, location: 'SNCU Bed 100', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },

  // RML (10 stations: BED 10 to BED 100)
  { _id: 'st_rml_10', stationId: 'PT-RML-10', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 10', type: 'double_surface' as PTStationType, location: 'NICU Pod 10', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_20', stationId: 'PT-RML-20', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 20', type: 'led_tunnel' as PTStationType, location: 'NICU Pod 20', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_30', stationId: 'PT-RML-30', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 30', type: 'single_surface' as PTStationType, location: 'NICU Pod 30', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_40', stationId: 'PT-RML-40', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 40', type: 'fiberoptic_blanket' as PTStationType, location: 'NICU Pod 40', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_50', stationId: 'PT-RML-50', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 50', type: 'double_surface' as PTStationType, location: 'NICU Pod 50', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_60', stationId: 'PT-RML-60', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 60', type: 'led_tunnel' as PTStationType, location: 'NICU Pod 60', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_70', stationId: 'PT-RML-70', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 70', type: 'single_surface' as PTStationType, location: 'SNCU Pod 70', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_80', stationId: 'PT-RML-80', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 80', type: 'fiberoptic_blanket' as PTStationType, location: 'SNCU Pod 80', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_90', stationId: 'PT-RML-90', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 90', type: 'double_surface' as PTStationType, location: 'SNCU Pod 90', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_rml_100', stationId: 'PT-RML-100', hospitalId: 'hosp_rml', hospitalName: 'RML', name: 'BED 100', type: 'led_tunnel' as PTStationType, location: 'SNCU Pod 100', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },

  // KGMU (7 stations: BED 10 to BED 70)
  { _id: 'st_kgmu_10', stationId: 'PT-KGMU-10', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 10', type: 'double_surface' as PTStationType, location: 'Care Unit 10', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_20', stationId: 'PT-KGMU-20', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 20', type: 'single_surface' as PTStationType, location: 'Care Unit 20', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_30', stationId: 'PT-KGMU-30', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 30', type: 'fiberoptic_blanket' as PTStationType, location: 'Care Unit 30', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_40', stationId: 'PT-KGMU-40', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 40', type: 'single_surface' as PTStationType, location: 'Care Unit 40', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_50', stationId: 'PT-KGMU-50', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 50', type: 'double_surface' as PTStationType, location: 'Care Unit 50', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_60', stationId: 'PT-KGMU-60', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 60', type: 'led_tunnel' as PTStationType, location: 'Care Unit 60', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
  { _id: 'st_kgmu_70', stationId: 'PT-KGMU-70', hospitalId: 'hosp_kgmu', hospitalName: 'KGMU', name: 'BED 70', type: 'fiberoptic_blanket' as PTStationType, location: 'Care Unit 70', operationalStatus: 'available' as PTStationStatus, currentBabyId: null, currentBabyName: null, currentBabyUhid: null, lastCleanedAt: new Date(), lastUpdated: new Date() },
];

// Seed memory if empty
if (memoryHospitals.length === 0) {
  memoryHospitals.push(...(SEED_HOSPITALS as any));
  memoryStations.push(...(SEED_STATIONS as any));
}

export class HospitalsService {
  /**
   * Recalculate capacity: Available = Operational - Occupied
   */
  static async refreshCapacity(hospitalId: string) {
    const stations = await this.getStations(hospitalId);
    const total = stations.length;
    const operational = stations.filter(
      (s) => s.operationalStatus !== 'maintenance' && s.operationalStatus !== 'out_of_service'
    ).length;
    const occupied = stations.filter((s) => s.operationalStatus === 'occupied').length;
    const available = Math.max(0, operational - occupied);

    if (isMongoConnected) {
      await HospitalModel.findByIdAndUpdate(hospitalId, {
        totalPTStations: total,
        operationalPTStations: operational,
        occupiedPTStations: occupied,
        availablePTStations: available,
        lastAvailabilityUpdated: new Date(),
      }).catch(() => null);
    }

    const memHosp = memoryHospitals.find((h) => (h as any)._id === hospitalId || h.id === hospitalId);
    if (memHosp) {
      memHosp.totalPTStations = total;
      memHosp.operationalPTStations = operational;
      memHosp.occupiedPTStations = occupied;
      memHosp.availablePTStations = available;
      memHosp.lastAvailabilityUpdated = new Date();
    }

    return { total, operational, occupied, available };
  }

  static async listHospitals(type?: 'referring_centre' | 'receiving_hospital') {
    if (isMongoConnected) {
      try {
        const query: any = {};
        if (type) query.type = type;
        const list = await HospitalModel.find(query).sort({ availablePTStations: -1 });
        if (list.length > 0) return list;
      } catch { }
    }

    let filtered = memoryHospitals;
    if (type) {
      filtered = filtered.filter((h) => h.type === type);
    }
    return filtered;
  }

  static async getHospitalById(id: string) {
    if (isMongoConnected) {
      try {
        const hosp = await HospitalModel.findById(id);
        if (hosp) return hosp;
      } catch { }
    }
    const found = memoryHospitals.find((h) => (h as any)._id === id || h.id === id);
    if (!found) throw new NotFoundError('Hospital not found');
    return found;
  }

  static async getStations(hospitalId: string) {
    const naturalSort = (items: IPTStation[]) => {
      return items.slice().sort((a, b) => {
        const numA = parseInt(a.name?.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.name?.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
    };

    if (isMongoConnected) {
      try {
        const list = await PTStationModel.find({ hospitalId }).lean();
        if (list.length > 0) return naturalSort(list as any);
      } catch { }
    }
    const mem = memoryStations.filter((s) => String(s.hospitalId) === String(hospitalId));
    return naturalSort(mem as any);
  }

  static async createStation(data: {
    hospitalId: string;
    stationId: string;
    name: string;
    type: PTStationType;
    location: string;
    notes?: string;
  }) {
    const hospital = await this.getHospitalById(data.hospitalId);

    // Double check stationId uniqueness in this hospital
    const existing = memoryStations.find(
      (s) => String(s.hospitalId) === String(data.hospitalId) && s.stationId === data.stationId.toUpperCase()
    );
    if (existing) {
      throw new BadRequestError(`Station ID ${data.stationId} already exists in ${hospital.name}`);
    }

    const newStation: any = {
      _id: 'st_' + Date.now(),
      stationId: data.stationId.toUpperCase(),
      hospitalId: data.hospitalId,
      hospitalName: hospital.name,
      name: data.name,
      type: data.type || 'double_surface',
      location: data.location || 'NICU Ward',
      operationalStatus: 'available' as PTStationStatus,
      currentBabyId: null,
      notes: data.notes || '',
      lastCleanedAt: new Date(),
      lastUpdated: new Date(),
    };

    if (isMongoConnected) {
      try {
        await PTStationModel.create(newStation);
      } catch { }
    }

    memoryStations.push(newStation);
    await this.refreshCapacity(data.hospitalId);
    return newStation;
  }

  static async updateStationStatus(
    stationId: string,
    status: PTStationStatus,
    meta?: { babyId?: string; babyName?: string; babyUhid?: string; notes?: string }
  ) {
    const station = memoryStations.find((s) => String((s as any)._id) === String(stationId) || s.stationId === stationId);
    if (!station) throw new NotFoundError('PT Station not found');

    // Rule: Double allocation prevention!
    if (status === 'occupied' && station.operationalStatus === 'occupied') {
      if (meta?.babyId && station.currentBabyId && String(station.currentBabyId) !== String(meta.babyId)) {
        throw new BadRequestError(`Station ${station.stationId} is already occupied by ${station.currentBabyName || 'another patient'}`);
      }
    }

    // Rule: Out of service / maintenance cannot be allocated
    if (status === 'occupied' && (station.operationalStatus === 'maintenance' || station.operationalStatus === 'out_of_service')) {
      throw new BadRequestError(`Station ${station.stationId} is currently under ${station.operationalStatus} and cannot be occupied.`);
    }

    station.operationalStatus = status;
    station.lastUpdated = new Date();

    if (status === 'occupied') {
      station.currentBabyId = meta?.babyId || station.currentBabyId;
      station.currentBabyName = meta?.babyName || station.currentBabyName;
      station.currentBabyUhid = meta?.babyUhid || station.currentBabyUhid;
      station.allocatedAt = new Date();
    } else if (status === 'cleaning_prep') {
      // Releasing station after patient discharge
      station.currentBabyId = null;
      station.currentBabyName = null;
      station.currentBabyUhid = null;
      station.allocatedAt = null;
    } else if (status === 'available') {
      station.currentBabyId = null;
      station.currentBabyName = null;
      station.currentBabyUhid = null;
      station.allocatedAt = null;
      station.lastCleanedAt = new Date();
    }

    if (meta?.notes !== undefined) {
      station.notes = meta.notes;
    }

    if (isMongoConnected) {
      try {
        await PTStationModel.findByIdAndUpdate(station._id, station);
      } catch { }
    }

    await this.refreshCapacity(String(station.hospitalId));
    return station;
  }

  static async togglePauseReferrals(hospitalId: string, isPaused: boolean, reason?: string) {
    const hospital = await this.getHospitalById(hospitalId);
    (hospital as any).isReferralPaused = isPaused;
    (hospital as any).pauseReason = reason || (isPaused ? 'Temporarily paused by clinical department' : undefined);
    hospital.lastAvailabilityUpdated = new Date();

    if (isMongoConnected) {
      try {
        await HospitalModel.findByIdAndUpdate(hospital._id, hospital);
      } catch { }
    }

    return hospital;
  }
}