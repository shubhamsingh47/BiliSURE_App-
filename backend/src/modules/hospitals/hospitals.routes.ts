import { Router } from 'express';
import { HospitalsController } from './hospitals.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public / Authenticated endpoints
router.get('/', HospitalsController.list);
router.get('/:id', HospitalsController.getById);
router.get('/:id/stations', HospitalsController.getStations);
router.post('/:id/stations', authenticate, HospitalsController.createStation);
router.patch('/:id/stations/:stationId/status', authenticate, HospitalsController.updateStationStatus);
router.patch('/:id/pause-referrals', authenticate, HospitalsController.togglePause);

export { router as hospitalRoutes };
