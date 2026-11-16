import { Router } from 'express';
import { DevicesController } from './devices.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/profile', authenticate, DevicesController.getProfile);
router.put('/settings', authenticate, DevicesController.updateSettings);
router.post('/calibrate', authenticate, DevicesController.calibrate);
router.get('/diagnostics', authenticate, DevicesController.diagnostics);

export const deviceRoutes = router;
