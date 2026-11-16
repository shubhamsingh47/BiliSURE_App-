import { Router } from 'express';
import { ReservationController } from './reservation.controller';

const router = Router();

router.post('/', ReservationController.createReservation);
router.get('/hospital/:hospitalId', ReservationController.getHospitalReservations);
router.post('/:reservationId/extend', ReservationController.extendReservation);
router.post('/:reservationId/cancel', ReservationController.cancelReservation);

export { router as reservationRoutes };
