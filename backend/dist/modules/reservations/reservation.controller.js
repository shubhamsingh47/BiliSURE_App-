"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const CapacityReservation_1 = require("../../models/CapacityReservation");
const Hospital_1 = require("../../models/Hospital");
const Referral_1 = require("../../models/Referral");
const StationAvailabilityHistory_1 = require("../../models/StationAvailabilityHistory");
const Notification_1 = require("../../models/Notification");
const response_1 = require("../../common/response");
const errors_1 = require("../../common/errors");
// In-memory fallback persistence for reservations
const inMemoryReservations = new Map();
class ReservationController {
    /**
     * Create a capacity reservation for an accepted referral
     */
    static async createReservation(req, res, next) {
        try {
            const { referralId, hospitalId, durationMinutes = 120, stationId, stationName, reservedBy = 'Hospital Staff', } = req.body;
            if (!referralId || !hospitalId) {
                throw new errors_1.BadRequestError('referralId and hospitalId are required');
            }
            // 1. Fetch Referral
            let referral = null;
            try {
                referral = await Referral_1.ReferralModel.findOne({
                    $or: [{ _id: referralId }, { referralId: referralId }],
                });
            }
            catch (e) {
                // Fallback search
            }
            // Check for existing active reservation to prevent duplicates
            const existing = await CapacityReservation_1.CapacityReservationModel.findOne({
                referralId,
                status: 'active',
            }).catch(() => null);
            if (existing || inMemoryReservations.get(referralId)?.status === 'active') {
                throw new errors_1.BadRequestError('An active capacity reservation already exists for this referral');
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
            let createdReservation = null;
            try {
                createdReservation = await CapacityReservation_1.CapacityReservationModel.create(reservationData);
            }
            catch (err) {
                createdReservation = { ...reservationData, id: reservationId, _id: reservationId };
                inMemoryReservations.set(reservationId, createdReservation);
                inMemoryReservations.set(referralId, createdReservation);
            }
            // 2. Decrement available capacity by updating hospital reserved count
            try {
                await Hospital_1.HospitalModel.findByIdAndUpdate(hospitalId, {
                    $inc: { reservedPTStations: 1 },
                    $set: { lastAvailabilityUpdated: new Date() },
                });
            }
            catch (e) {
                // In-memory or detached
            }
            // 3. Mark referral as having a capacity reservation
            if (referral) {
                referral.reservationId = reservationId;
                referral.hasCapacityReservation = true;
                await referral.save().catch(() => { });
            }
            // 4. Record Station Availability History
            try {
                await StationAvailabilityHistory_1.StationAvailabilityHistoryModel.create({
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
            }
            catch (e) { }
            // 5. Create In-App Notification
            try {
                await Notification_1.NotificationModel.create({
                    targetRole: 'hospital_nurse',
                    targetFacilityId: hospitalId,
                    title: 'PT Station Reserved',
                    message: `Station reserved for incoming referral ${referral?.babyName || 'Newborn'} (Expires in ${durationMinutes} mins)`,
                    type: 'station_alert',
                    metadata: { reservationId, referralId },
                });
            }
            catch (e) { }
            (0, response_1.sendSuccess)(res, createdReservation, 201, 'Capacity reservation created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get active reservations for hospital
     */
    static async getHospitalReservations(req, res, next) {
        try {
            const hospitalId = String(req.params.hospitalId);
            const now = new Date();
            let list = [];
            try {
                // Auto-expire reservations past expiry
                await CapacityReservation_1.CapacityReservationModel.updateMany({ hospitalId, status: 'active', expiresAt: { $lt: now } }, { $set: { status: 'expired' } });
                list = await CapacityReservation_1.CapacityReservationModel.find({ hospitalId }).sort({ createdAt: -1 });
            }
            catch (e) {
                list = Array.from(inMemoryReservations.values()).filter((r) => r.hospitalId === hospitalId);
            }
            (0, response_1.sendSuccess)(res, list, 200, 'Hospital reservations retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Extend reservation
     */
    static async extendReservation(req, res, next) {
        try {
            const reservationId = String(req.params.reservationId);
            const { extraMinutes = 60, performedBy = 'Hospital Staff' } = req.body;
            let reservation = null;
            try {
                reservation = await CapacityReservation_1.CapacityReservationModel.findOne({
                    $or: [{ reservationId }, { _id: reservationId }],
                });
            }
            catch (e) {
                reservation = inMemoryReservations.get(reservationId);
            }
            if (!reservation) {
                throw new errors_1.NotFoundError('Capacity reservation not found');
            }
            if (reservation.status !== 'active') {
                throw new errors_1.BadRequestError(`Cannot extend reservation with status: ${reservation.status}`);
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
            (0, response_1.sendSuccess)(res, reservation, 200, 'Capacity reservation extended successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Cancel reservation
     */
    static async cancelReservation(req, res, next) {
        try {
            const reservationId = String(req.params.reservationId);
            const { cancellationReason = 'Bed no longer needed', performedBy = 'Hospital Staff' } = req.body;
            let reservation = null;
            try {
                reservation = await CapacityReservation_1.CapacityReservationModel.findOne({
                    $or: [{ reservationId }, { _id: reservationId }],
                });
            }
            catch (e) {
                reservation = inMemoryReservations.get(reservationId);
            }
            if (!reservation) {
                throw new errors_1.NotFoundError('Capacity reservation not found');
            }
            if (reservation.status !== 'active') {
                throw new errors_1.BadRequestError(`Reservation is not active (current status: ${reservation.status})`);
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
                await Hospital_1.HospitalModel.findByIdAndUpdate(reservation.hospitalId, {
                    $inc: { reservedPTStations: -1 },
                    $set: { lastAvailabilityUpdated: new Date() },
                });
            }
            catch (e) { }
            (0, response_1.sendSuccess)(res, reservation, 200, 'Capacity reservation cancelled');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReservationController = ReservationController;
