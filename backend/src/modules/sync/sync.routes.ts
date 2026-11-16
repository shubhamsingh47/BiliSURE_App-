import { Router } from 'express';
import { SyncController } from './sync.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.post('/batch', authenticate, SyncController.batch);

export const syncRoutes = router;
