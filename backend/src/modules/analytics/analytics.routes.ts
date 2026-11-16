import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/summary-total', authenticate, AnalyticsController.getSummary);
router.get('/stories', authenticate, AnalyticsController.getStories);
router.get('/export', authenticate, AnalyticsController.exportData);

export const analyticsRoutes = router;
