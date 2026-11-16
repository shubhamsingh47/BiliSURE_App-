import { Router } from 'express';
import { DevicesController } from './devices.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/profile', authenticate, DevicesController.getProfile);
router.put('/settings', authenticate, DevicesController.updateSettings);
router.post('/calibrate', authenticate, DevicesController.calibrate);
router.get('/diagnostics', authenticate, DevicesController.diagnostics);

export const deviceRoutes = router;
