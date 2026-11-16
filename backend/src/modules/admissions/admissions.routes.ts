import { Router } from 'express';
import { AdmissionsController } from './admissions.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', AdmissionsController.list);
router.get('/:id', AdmissionsController.getById);
router.get('/baby/:babyId', AdmissionsController.getByBabyId);

router.post('/confirm-arrival', authenticate, AdmissionsController.confirmArrival);
router.post('/:id/allocate-station', authenticate, AdmissionsController.allocateStation);
router.post('/:id/sessions/start', authenticate, AdmissionsController.startSession);
router.post('/:id/sessions/:sessionId/end', authenticate, AdmissionsController.endSession);
router.post('/:id/discharge', authenticate, AdmissionsController.completeDischarge);

export { router as admissionRoutes };
