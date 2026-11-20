import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/plans', BillingController.getPlans);
router.get('/subscription', BillingController.getHospitalSubscription);
router.get('/usage-history', BillingController.getUsageHistory);
router.post('/select-plan', BillingController.selectPlan);
router.get('/superadmin-summary', authorizeRoles('district_admin'), BillingController.getSuperAdminSummary);

export const billingRoutes = router;
