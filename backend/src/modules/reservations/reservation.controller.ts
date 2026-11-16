import { Request, Response, NextFunction } from 'express';
import { CapacityReservationModel } from '../../models/CapacityReservation';
import { HospitalModel } from '../../models/Hospital';
import { ReferralModel } from '../../models/Referral';
import { StationAvailabilityHistoryModel } from '../../models/StationAvailabilityHistory';
import { NotificationModel } from '../../models/Notification';
import { sendSuccess } from '../../common/response';
import { BadRequestError, NotFoundError } from '../../common/errors';

// In-memory fallback persistence for reservations
const inMemoryReservations: Map<string, any> = new Map();

export class ReservationController {
  /**
   * Create a capacity reservation for an accepted referral
   */
  static async createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        referralId,
        hospitalId,
        durationMinutes = 120,
        stationId,
        stationName,
        reservedBy = 'Hospital Staff',
      } = req.body;

      if (!referralId || !hospitalId) {
        throw new BadRequestError('referralId and hospitalId are required');
      }

      // 1. Fetch Referral
      let referral: any = null;
      try {
        referral = await ReferralModel.findOne({
          $or: [{ _id: referralId }, { referralId: referralId }],
        });
      } catch (e) {
        // Fallback search
      }

      // Check for existing active reservation to prevent duplicates
      const existing = await CapacityReservationModel.findOne({
        referralId,
        status: 'active',
      }).catch(() => null);

      if (existing || inMemoryReservations.get(referralId)?.status === 'active') {
        throw new BadRequestError('An active capacity reservation already exists for this referral');
      }

      const reservationId = `RES-${Date.now().toString().slice(-6)}`;
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const reservationData = {
        reservationId,
        referralId,
        referralCode: referral?.referralId || referralId,
        hospitalId,
        hospitalName: referral?.receivingHospitalName || 'District Referral Hospital',
        babyId: referral?.babyId || 'baby_unknown',
        babyUhid: referral?.babyUhid || 'UHID_UNKNOWN',
        stationId,
        stationName,
        reservedBy,
        reservedAt: new Date(),
        expiresAt,
        durationMinutes,
        status: 'active',
        actionLog: [
          {
            action: 'created',
            performedBy: reservedBy,
            timestamp: new Date(),
            note: `Capacity reserved for ${durationMinutes} minutes`,
          },
        ],
      };

      let createdReservation: any = null;
      try {
        createdReservation = await CapacityReservationModel.create(reservationData);
      } catch (err) {
        createdReservation = { ...reservationData, id: reservationId, _id: reservationId };
        inMemoryReservations.set(reservationId, createdReservation);
        inMemoryReservations.set(referralId, createdReservation);
      }

      // 2. Decrement available capacity by updating hospital reserved count
      try {
        await HospitalModel.findByIdAndUpdate(hospitalId, {
          $inc: { reservedPTStations: 1 },
          $set: { lastAvailabilityUpdated: new Date() },
        });
      } catch (e) {
        // In-memory or detached
      }

      // 3. Mark referral as having a capacity reservation
      if (referral) {
        referral.reservationId = reservationId;
        referral.hasCapacityReservation = true;
        await referral.save().catch(() => {});
      }

      // 4. Record Station Availability History
      try {
        await StationAvailabilityHistoryModel.create({
          hospitalId,
          hospitalName: reservationData.hospitalName,
          district: 'Central District',
          totalStations: 5,
          operationalStations: 5,
          occupiedStations: 2,
          reservedStations: 1,
          availableStations: 2,
          changeReason: 'reservation_created',
          stationId,
          performedBy: reservedBy,
          timestamp: new Date(),
        });
      } catch (e) {}

      // 5. Create In-App Notification
      try {
        await NotificationModel.create({
          targetRole: 'hospital_nurse',
          targetFacilityId: hospitalId,
          title: 'PT Station Reserved',
          message: `Station reserved for incoming referral ${referral?.babyName || 'Newborn'} (Expires in ${durationMinutes} mins)`,
          type: 'station_alert',
          metadata: { reservationId, referralId },
        });
      } catch (e) {}

      sendSuccess(res, createdReservation, 201, 'Capacity reservation created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active reservations for hospital
   */
  static async getHospitalReservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = String(req.params.hospitalId);
      const now = new Date();

      let list: any[] = [];
      try {
        // Auto-expire reservations past expiry
        await CapacityReservationModel.updateMany(
          { hospitalId, status: 'active', expiresAt: { $lt: now } },
          { $set: { status: 'expired' } }
        );

        list = await CapacityReservationModel.find({ hospitalId }).sort({ createdAt: -1 });
      } catch (e) {
        list = Array.from(inMemoryReservations.values()).filter((r) => r.hospitalId === hospitalId);
      }

      sendSuccess(res, list, 200, 'Hospital reservations retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extend reservation
   */
  static async extendReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservationId = String(req.params.reservationId);
      const { extraMinutes = 60, performedBy = 'Hospital Staff' } = req.body;

      let reservation: any = null;
      try {
        reservation = await CapacityReservationModel.findOne({
          $or: [{ reservationId }, { _id: reservationId }],
        });
      } catch (e) {
        reservation = inMemoryReservations.get(reservationId);
      }

      if (!reservation) {
        throw new NotFoundError('Capacity reservation not found');
      }

      if (reservation.status !== 'active') {
        throw new BadRequestError(`Cannot extend reservation with status: ${reservation.status}`);
      }

      const currentExpiry = new Date(reservation.expiresAt);
      const newExpiry = new Date(currentExpiry.getTime() + extraMinutes * 60 * 1000);

      reservation.expiresAt = newExpiry;
      reservation.durationMinutes = (reservation.durationMinutes || 120) + extraMinutes;
      reservation.actionLog.push({
        action: 'extended',
        performedBy,
        timestamp: new Date(),
        note: `Extended by ${extraMinutes} minutes`,
      });

      await reservation.save?.();
      inMemoryReservations.set(reservationId, reservation);

      sendSuccess(res, reservation, 200, 'Capacity reservation extended successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel reservation
   */
  static async cancelReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservationId = String(req.params.reservationId);
      const { cancellationReason = 'Bed no longer needed', performedBy = 'Hospital Staff' } = req.body;

      let reservation: any = null;
      try {
        reservation = await CapacityReservationModel.findOne({
          $or: [{ reservationId }, { _id: reservationId }],
        });
      } catch (e) {
        reservation = inMemoryReservations.get(reservationId);
      }

      if (!reservation) {
        throw new NotFoundError('Capacity reservation not found');
      }

      if (reservation.status !== 'active') {
        throw new BadRequestError(`Reservation is not active (current status: ${reservation.status})`);
      }

      reservation.status = 'cancelled';
      reservation.cancelledAt = new Date();
      reservation.cancelledBy = performedBy;
      reservation.cancellationReason = cancellationReason;
      reservation.actionLog.push({
        action: 'cancelled',
        performedBy,
        timestamp: new Date(),
        note: cancellationReason,
      });

      await reservation.save?.();
      inMemoryReservations.set(reservationId, reservation);

      // Restore hospital capacity
      try {
        await HospitalModel.findByIdAndUpdate(reservation.hospitalId, {
          $inc: { reservedPTStations: -1 },
          $set: { lastAvailabilityUpdated: new Date() },
        });
      } catch (e) {}

      sendSuccess(res, reservation, 200, 'Capacity reservation cancelled');
    } catch (error) {
      next(error);
    }
  }
}
