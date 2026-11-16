import { Router } from 'express';
import { ObservationsController } from './observations.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, ObservationsController.list);
router.post('/', authenticate, ObservationsController.create);

export const observationRoutes = router;
