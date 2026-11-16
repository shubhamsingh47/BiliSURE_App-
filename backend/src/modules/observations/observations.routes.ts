import { Router } from 'express';
import { ObservationsController } from './observations.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, ObservationsController.list);
router.post('/', authenticate, ObservationsController.create);

export const observationRoutes = router;
