import { Router } from 'express';
import { ReferralsController } from './referrals.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', ReferralsController.list);
router.get('/:id', ReferralsController.getById);
router.post('/', authenticate, ReferralsController.create);
router.patch('/:id/accept', authenticate, ReferralsController.accept);
router.patch('/:id/reject', authenticate, ReferralsController.reject);
router.patch('/:id/clarify', authenticate, ReferralsController.clarify);
router.patch('/:id/cancel', authenticate, ReferralsController.cancel);
router.post('/:id/rerefer', authenticate, ReferralsController.reRefer);

export { router as referralRoutes };
