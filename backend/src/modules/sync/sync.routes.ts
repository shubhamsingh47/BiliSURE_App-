import { Router } from 'express';
import { SyncController } from './sync.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/batch', authenticate, SyncController.batch);

export const syncRoutes = router;
