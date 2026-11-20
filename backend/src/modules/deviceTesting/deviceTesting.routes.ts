import { Router } from 'express';
import { DeviceTestingController } from './deviceTesting.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/devices', DeviceTestingController.getDevices);
router.post('/scan', DeviceTestingController.runScan);
router.get('/history', DeviceTestingController.getHistory);
router.get('/summary', DeviceTestingController.getSummary);

export const deviceTestingRoutes = router;
