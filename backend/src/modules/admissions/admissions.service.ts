import { AdmissionModel, IAdmission, ITreatmentSession } from '../../models/Admission';
import { BabyModel } from '../../models/Baby';
import { PTStationModel } from '../../models/PTStation';
import { ReferralsService } from '../referrals/referrals.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isMongoConnected } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../common/errors';

const memoryAdmissions: IAdmission[] = [];

export class AdmissionsService {
  static async listAdmissions(query: { hospitalId?: string; status?: string; facility?: string }) {
    const targetHosp =
      query.facility ||
      (query.hospitalId === 'hosp_kgmu'
        ? 'KGMU'
        : query.hospitalId === 'hosp_rml'
          ? 'RML'
          : query.hospitalId === 'hosp_pgi'
            ? 'PGI'
            : query.hospitalId?.replace(/^hosp_/i, '').toUpperCase());

    const targetHospId =
      query.hospitalId ||
      (targetHosp === 'KGMU'
        ? 'hosp_kgmu'
        : targetHosp === 'RML'
          ? 'hosp_rml'
          : targetHosp === 'PGI'
            ? 'hosp_pgi'
            : undefined);

    let list: any[] = [];

    if (isMongoConnected) {
      try {
        const filter: any = {};
        if (targetHospId || targetHosp) {
          const hospConditions: any[] = [];
          if (targetHospId) hospConditions.push({ hospitalId: targetHospId });
          if (targetHosp) hospConditions.push({ hospitalName: new RegExp(`^${targetHosp}$`, 'i') });
          filter.$or = hospConditions;
        }
        if (query.status) {
          filter.admissionStatus = query.status;
        }
        list = await AdmissionModel.find(filter).lean();

        // Also query BabyModel for any babies under treatment in this hospital
        if (!query.status || query.status === 'under_treatment') {
          const babyHospCond: any[] = [];
          if (targetHosp) {
            babyHospCond.push({ facility: new RegExp(`^${targetHosp}$`, 'i') });
            babyHospCond.push({ currentHospital: new RegExp(`^${targetHosp}$`, 'i') });
          }
          if (targetHospId) {
            babyHospCond.push({ facility: targetHospId });
            babyHospCond.push({ currentHospital: targetHospId });
          }

          const activeBabies = await BabyModel.find({
            status: 'under_treatment',
            ...(babyHospCond.length > 0 ? { $or: babyHospCond } : {}),
          }).lean();

          if (activeBabies.length > 0) {
            for (const b of activeBabies) {
              const alreadyInList = list.some(
                (a) => a.babyUhid === b.uhid || (b._id && String(a.babyId) === String(b._id))
              );
              if (!alreadyInList) {
                // Find matching station to get full hospital-scoped station details
                let stName = b.currentStationId || 'Station Assigned';
                let stId = b.currentStationId || 'Station Assigned';
                try {
                  const stationQuery: any = {
                    $or: [{ name: b.currentStationId }, { stationId: b.currentStationId }],
                  };
                  if (targetHospId || targetHosp) {
                    stationQuery.$and = [
                      {
                        $or: [
                          ...(targetHospId ? [{ hospitalId: targetHospId }] : []),
                          ...(targetHosp ? [{ hospitalName: new RegExp(`^${targetHosp}$`, 'i') }] : []),
                        ],
                      },
                    ];
                  }
                  const st = await PTStationModel.findOne(stationQuery).lean();
                  if (st) {
                    stName = `${st.name} (${st.stationId})`;
                    stId = (st as any).stationId || String((st as any)._id);
                  }
                } catch { }

                const syntheticAdm = {
                  _id: 'adm_baby_' + b._id,
                  admissionId: 'ADM-' + (b.uhid?.replace(/\D/g, '').slice(-4) || '0000'),
                  babyId: String(b._id),
                  babyUhid: b.uhid,
                  babyName: b.parentsName || b.name,
                  hospitalId: targetHospId || (b.facility ? `hosp_${b.facility.toLowerCase()}` : 'hosp_pgi'),
                  hospitalName: targetHosp || b.facility || 'PGI',
                  physicalArrivalConfirmed: true,
                  arrivalConfirmedAt: b.createdAt || new Date(),
                  admittedAt: b.createdAt || new Date(),
                  admissionStatus: 'under_treatment' as const,
                  assignedDoctor: b.assignedDoctor || 'Dr. Hospital Paediatrician',
                  primaryNurse: 'Staff Nurse',
                  ptStationId: stId,
                  ptStationName: stName,
                  initialAdmissionBilirubin: b.initialValue || 14.5,
                  treatmentSessions: [],
                  stationReleased: false,
                  createdAt: b.createdAt || new Date(),
                  updatedAt: b.updatedAt || new Date(),
                };
                list.push(syntheticAdm);
              }
            }
          }
        }

        return list;
      } catch (err) {
        // Fallback to memory
      }
    }

    let memList = [...memoryAdmissions];
    if (targetHospId || targetHosp) {
      memList = memList.filter(
        (a) =>
          (targetHospId && String(a.hospitalId) === String(targetHospId)) ||
          (targetHosp && a.hospitalName?.toUpperCase() === targetHosp.toUpperCase())
      );
    }
    if (query.status) {
      memList = memList.filter((a) => a.admissionStatus === query.status);
    }
    return memList;
  }

  static async getById(id: string) {
    let found = memoryAdmissions.find(
      (a) => (a as any)._id === id || a.admissionId === id || (a as any).id === id
    );
    if (!found && isMongoConnected) {
      try {
        found = (await AdmissionModel.findOne({ $or: [{ _id: id }, { admissionId: id }] })) as any;
      } catch { }
    }
    if (!found) throw new NotFoundError('Admission record not found');
    return found;
  }

  static async getByBabyId(babyId: string) {
    const found = memoryAdmissions.find(
      (a) => String(a.babyId) === String(babyId) || a.babyUhid === babyId
    );
    return found || null;
  }

  /**
   * Step 17: Confirm physical arrival of baby at hospital
   */
  static async confirmArrival(data: {
    referralId: string;
    nurseName: string;
    hospitalId: string;
  }) {
    const ref = await ReferralsService.getById(data.referralId);
    ref.status = 'arrived';
    ref.arrivedAt = new Date();
    ref.arrivalConfirmedBy = data.nurseName;

    const admissionId = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdmission: any = {
      _id: 'adm_' + Date.now(),
      admissionId,
      babyId: String(ref.babyId),
      babyUhid: ref.babyUhid,
      babyName: ref.babyName,
      hospitalId: String(data.hospitalId || ref.receivingHospitalId),
      hospitalName: ref.receivingHospitalName,
      referralId: String((ref as any)._id || ref.referralId),
      physicalArrivalConfirmed: true,
      arrivalConfirmedAt: new Date(),
      arrivalConfirmedBy: data.nurseName,
      admittedAt: new Date(),
      admissionStatus: 'admitted',
      assignedDoctor: 'Dr. Hospital Paediatrician',
      primaryNurse: data.nurseName,
      initialAdmissionBilirubin: ref.latestBilirubinValue,
      treatmentSessions: [],
      stationReleased: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryAdmissions.unshift(newAdmission);

    // Fulfill any active capacity reservation
    try {
      const { CapacityReservationModel } = require('../../models/CapacityReservation');
      const { HospitalModel } = require('../../models/Hospital');
      await CapacityReservationModel.findOneAndUpdate(
        { referralId: data.referralId, status: 'active' },
        { status: 'fulfilled', fulfilledAt: new Date(), admissionId }
      );
      await HospitalModel.findByIdAndUpdate(newAdmission.hospitalId, {
        $inc: { reservedPTStations: -1 },
      });
    } catch (e) { }

    // Notify referring doctor and hospital team
    await NotificationsService.createNotification({
      recipientRole: 'referring_doctor',
      centreName: ref.referringCentreName,
      title: `Baby Arrived at Hospital: ${ref.babyName}`,
      message: `Nurse ${data.nurseName} at ${ref.receivingHospitalName} confirmed physical arrival of ${ref.babyName} (${ref.babyUhid}). Admission opened.`,
      type: 'baby_arrived',
      relatedBabyUhid: ref.babyUhid,
      relatedReferralId: ref.referralId,
    });

    return { referral: ref, admission: newAdmission };
  }

  /**
   * Step 19: Allocate PT Station to an admitted baby
   */
  static async allocateStation(data: {
    admissionId: string;
    stationId: string;
    nurseName: string;
  }) {
    const admission = await this.getById(data.admissionId);
    if (!admission) throw new NotFoundError('Admission not found');

    if (admission.ptStationId) {
      throw new BadRequestError(`Admission ${data.admissionId} already has an allocated station (${admission.ptStationName})`);
    }

    const hospitalStations = await HospitalsService.getStations(String(admission.hospitalId));
    const alreadyAllocated = hospitalStations.find(
      (s) => s.operationalStatus === 'occupied' && s.currentBabyUhid === admission.babyUhid
    );
    if (alreadyAllocated) {
      throw new BadRequestError(`Patient with UHID ${admission.babyUhid} is already allocated to station ${alreadyAllocated.stationId}`);
    }

    // Update station status to occupied with baby info
    const station = await HospitalsService.updateStationStatus(
      data.stationId,
      'occupied',
      {
        babyId: String(admission.babyId),
        babyName: admission.babyName,
        babyUhid: admission.babyUhid,
        notes: `Allocated to ${admission.babyName} by ${data.nurseName}`,
      },
      String(admission.hospitalId)
    );

    admission.ptStationId = String((station as any)._id || station.stationId);
    admission.ptStationName = `${station.name} (${station.stationId})`;
    admission.admissionStatus = 'under_treatment';
    admission.primaryNurse = data.nurseName;
    admission.updatedAt = new Date();

    // Also update Baby model status
    try {
      if (isMongoConnected) {
        await BabyModel.findOneAndUpdate(
          { uhid: admission.babyUhid },
          { status: 'under_treatment', currentStationId: station.stationId }
        );
      }
    } catch { }

    // Notify care team
    await NotificationsService.createNotification({
      recipientRole: 'hospital_doctor',
      hospitalId: String(admission.hospitalId),
      title: `PT Station Allocated: ${admission.babyName}`,
      message: `${admission.babyName} allocated to ${station.name} (${station.stationId}) by ${data.nurseName}. Ready for phototherapy initiation.`,
      type: 'pt_allocated',
      relatedBabyUhid: admission.babyUhid,
    });

    return { admission, station };
  }

  /**
   * Step 20: Start Phototherapy Treatment Session
   */
  static async startTreatmentSession(
    admissionId: string,
    data: {
      phototherapyType?: string;
      irradianceMwCm2?: number;
      nurseName: string;
      notes?: string;
    }
  ) {
    const admission = await this.getById(admissionId);

    // If an existing session is active, mark it completed
    admission.treatmentSessions.forEach((s) => {
      if (s.status === 'active') {
        s.status = 'completed';
        s.endTime = new Date();
        s.durationMinutes = Math.max(
          1,
          Math.round((s.endTime.getTime() - new Date(s.startTime).getTime()) / 60000)
        );
      }
    });

    const newSession: ITreatmentSession = {
      sessionId: 'sess_' + Date.now(),
      startTime: new Date(),
      phototherapyType: data.phototherapyType || 'Double Surface LED',
      irradianceMwCm2: data.irradianceMwCm2 || 35,
      nurseName: data.nurseName,
      notes: data.notes || 'Phototherapy initiated under continuous monitoring.',
      status: 'active',
    };

    admission.treatmentSessions.push(newSession);
    admission.admissionStatus = 'under_treatment';
    admission.updatedAt = new Date();

    return { admission, session: newSession };
  }

  /**
   * Log completed treatment session directly (e.g. from nurse flowsheet)
   */
  static async logTreatmentSession(
    admissionId: string,
    data: {
      startTime: string | Date;
      endTime: string | Date;
      durationMinutes?: number;
      phototherapyType?: string;
      irradianceMwCm2?: number;
      nurseName?: string;
      notes?: string;
      babyId?: string;
      babyUhid?: string;
      babyName?: string;
    }
  ) {
    let admission = memoryAdmissions.find(
      (a) => (a as any)._id === admissionId || a.admissionId === admissionId || (a as any).id === admissionId
    );
    if (!admission && isMongoConnected) {
      try {
        admission = (await AdmissionModel.findOne({
          $or: [{ _id: admissionId }, { admissionId }],
        })) as any;
      } catch { }
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const durationMinutes =
      data.durationMinutes !== undefined && !isNaN(Number(data.durationMinutes))
        ? Number(data.durationMinutes)
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    const newSession: ITreatmentSession = {
      sessionId: 'sess_' + Date.now(),
      startTime: start,
      endTime: end,
      durationMinutes,
      phototherapyType: data.phototherapyType || 'Double Surface LED',
      irradianceMwCm2: data.irradianceMwCm2 || 35,
      nurseName: data.nurseName || 'Nurse Staff',
      notes: data.notes || '',
      status: 'completed',
    };

    if (!admission) {
      // Auto-instantiate admission record in memory/db if initiated from client
      const newAdmission: any = {
        _id: admissionId,
        admissionId: admissionId.startsWith('ADM-') ? admissionId : `ADM-${Date.now().toString().slice(-4)}`,
        babyId: data.babyId || 'unknown',
        babyUhid: data.babyUhid || 'UNKNOWN',
        babyName: data.babyName || 'Baby Patient',
        hospitalId: 'hosp_pgi',
        hospitalName: 'PGI',
        physicalArrivalConfirmed: true,
        arrivalConfirmedAt: new Date(),
        arrivalConfirmedBy: data.nurseName || 'Nurse Staff',
        admittedAt: new Date(),
        admissionStatus: 'under_treatment',
        assignedDoctor: 'Dr. Hospital Paediatrician',
        primaryNurse: data.nurseName || 'Nurse Staff',
        initialAdmissionBilirubin: 14.0,
        treatmentSessions: [newSession],
        stationReleased: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryAdmissions.push(newAdmission);
      if (isMongoConnected) {
        try {
          await AdmissionModel.create(newAdmission);
        } catch { }
      }
      return { admission: newAdmission, session: newSession };
    }

    admission.treatmentSessions = admission.treatmentSessions || [];
    admission.treatmentSessions.push(newSession);
    admission.admissionStatus = 'under_treatment';
    admission.updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await AdmissionModel.findOneAndUpdate(
          { $or: [{ _id: admissionId }, { admissionId }] },
          {
            $push: { treatmentSessions: newSession },
            $set: { admissionStatus: 'under_treatment', updatedAt: new Date() },
          }
        );
      } catch (e) { }
    }

    return { admission, session: newSession };
  }

  /**
   * Update an existing treatment session
   */
  static async updateTreatmentSession(
    admissionId: string,
    sessionId: string,
    updates: Partial<ITreatmentSession>
  ) {
    let admission = memoryAdmissions.find(
      (a) => (a as any)._id === admissionId || a.admissionId === admissionId || (a as any).id === admissionId
    );
    if (!admission && isMongoConnected) {
      try {
        admission = (await AdmissionModel.findOne({
          $or: [{ _id: admissionId }, { admissionId }],
        })) as any;
      } catch { }
    }

    if (!admission) throw new NotFoundError('Admission record not found');

    const session = admission.treatmentSessions.find((s) => s.sessionId === sessionId);
    if (!session) throw new NotFoundError('Treatment session not found');

    if (updates.startTime) session.startTime = new Date(updates.startTime);
    if (updates.endTime) session.endTime = new Date(updates.endTime);
    if (updates.durationMinutes !== undefined) session.durationMinutes = Number(updates.durationMinutes);
    if (updates.phototherapyType) session.phototherapyType = updates.phototherapyType;
    if (updates.notes !== undefined) session.notes = updates.notes;
    if (updates.status) session.status = updates.status;
    admission.updatedAt = new Date();

    if (isMongoConnected) {
      try {
        await AdmissionModel.findOneAndUpdate(
          { $or: [{ _id: admissionId }, { admissionId }], 'treatmentSessions.sessionId': sessionId },
          {
            $set: {
              'treatmentSessions.$': session,
              updatedAt: new Date(),
            },
          }
        );
      } catch { }
    }

    return { admission, session };
  }

  /**
   * Step 22: Record Session Completion
   */
  static async endTreatmentSession(
    admissionId: string,
    sessionId: string,
    data: {
      nurseName: string;
      notes?: string;
    }
  ) {
    const admission = await this.getById(admissionId);
    const session = admission.treatmentSessions.find((s) => s.sessionId === sessionId);
    if (!session) throw new NotFoundError('Treatment session not found');

    session.endTime = new Date();
    session.durationMinutes = Math.max(
      1,
      Math.round((session.endTime.getTime() - new Date(session.startTime).getTime()) / 60000)
    );
    session.status = 'completed';
    if (data.notes) session.notes = (session.notes ? session.notes + ' | ' : '') + data.notes;
    admission.updatedAt = new Date();

    return { admission, session };
  }

  /**
   * Conclude Phototherapy Course & Release Station to Cleaning Pool
   * Does NOT discharge the baby; moves patient to in_observation for continued clinical monitoring.
   */
  static async concludePhototherapy(
    admissionId: string,
    data?: {
      nurseName?: string;
      notes?: string;
    }
  ) {
    const admission = await this.getById(admissionId);

    // Conclude any in-progress treatment session
    const runningSession = admission.treatmentSessions.find((s) => s.status === 'active');
    if (runningSession) {
      const now = new Date();
      runningSession.endTime = now;
      const durationMs = now.getTime() - new Date(runningSession.startTime).getTime();
      runningSession.durationMinutes = Math.max(1, Math.round(durationMs / 60000));
      runningSession.status = 'completed';
      if (data?.notes) {
        runningSession.notes = (runningSession.notes ? runningSession.notes + ' | ' : '') + data.notes;
      }
    }

    admission.cumulativeTreatmentMinutes = admission.treatmentSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );
    admission.updatedAt = new Date();

    const releasedStationId = admission.ptStationId;
    admission.admissionStatus = 'in_observation';
    admission.stationReleased = true;
    admission.ptStationId = undefined;
    admission.ptStationName = undefined;

    // Release the PT station to 'cleaning_prep'
    if (releasedStationId) {
      await HospitalsService.updateStationStatus(
        releasedStationId,
        'cleaning_prep',
        {
          notes: `Station freed following phototherapy conclusion for ${admission.babyName}. Ready for sanitization & cleaning.`,
        },
        String(admission.hospitalId)
      );
    }

    // Update Baby record: set to in_observation, clear station. CRITICAL: Baby is NOT discharged!
    try {
      if (isMongoConnected) {
        await BabyModel.findOneAndUpdate(
          { uhid: admission.babyUhid },
          {
            status: 'in_observation',
            currentStationId: undefined,
          }
        );
      }
    } catch { }

    // Notify attending care team
    await NotificationsService.createNotification({
      recipientRole: 'attending_doctor',
      title: `Phototherapy Concluded: ${admission.babyName}`,
      message: `Phototherapy course concluded for ${admission.babyName} (${admission.babyUhid}). Cumulative exposure: ${(admission.cumulativeTreatmentMinutes / 60).toFixed(1)} hrs. Patient moved to in-observation. Station released to cleaning pool.`,
      type: 'pt_concluded',
      relatedBabyUhid: admission.babyUhid,
    });

    if (isMongoConnected && typeof (admission as any).save === 'function') {
      await (admission as any).save();
    }

    return admission;
  }

  /**
   * Step 23 & 24: Discharge Approval & Hospital Episode Completion
   */
  static async completeDischarge(
    admissionId: string,
    data: {
      doctorName: string;
      dischargeBilirubinValue: number;
      dischargeNotes?: string;
      followUpPlan?: string;
    }
  ) {
    const admission = await this.getById(admissionId);

    admission.dischargeApprovedByDoctor = data.doctorName;
    admission.dischargeApprovedAt = new Date();
    admission.dischargeBilirubinValue = data.dischargeBilirubinValue;
    admission.dischargeNotes = data.dischargeNotes || 'Bilirubin successfully reduced below safe phototherapy threshold.';
    admission.followUpPlan = data.followUpPlan || 'Routine pediatric follow-up in 48 hours for rebound jaundice check.';
    admission.admissionStatus = 'discharged';
    admission.dischargedAt = new Date();
    admission.stationReleased = true;
    // Calculate cumulative delivered treatment duration from actual recorded sessions
    admission.cumulativeTreatmentMinutes = admission.treatmentSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );
    admission.updatedAt = new Date();

    // Step 25: Release the PT station to 'cleaning_prep'
    if (admission.ptStationId) {
      await HospitalsService.updateStationStatus(
        admission.ptStationId,
        'cleaning_prep',
        {
          notes: `Station freed following discharge of ${admission.babyName}. Ready for sanitization & cleaning.`,
        },
        String(admission.hospitalId)
      );
    }

    // Update Baby record
    try {
      if (isMongoConnected) {
        await BabyModel.findOneAndUpdate(
          { uhid: admission.babyUhid },
          {
            status: 'discharged',
            dischargeValue: data.dischargeBilirubinValue,
            currentStationId: undefined,
          }
        );
      }
    } catch { }

    // Notify referring doctor and care team
    await NotificationsService.createNotification({
      recipientRole: 'referring_doctor',
      title: `Patient Discharged: ${admission.babyName}`,
      message: `${admission.babyName} (${admission.babyUhid}) discharged by ${data.doctorName}. Discharge bilirubin: ${data.dischargeBilirubinValue} mg/dL. Follow-up: ${admission.followUpPlan}`,
      type: 'discharge_approved',
      relatedBabyUhid: admission.babyUhid,
    });

    return admission;
  }
}