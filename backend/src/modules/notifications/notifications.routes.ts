import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', NotificationsController.list);
router.patch('/:id/read', authenticate, NotificationsController.markRead);
router.post('/mark-all-read', authenticate, NotificationsController.markAllRead);

export { router as notificationRoutes };
