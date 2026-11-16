import { Router } from 'express';
import { RecommendationsController } from './recommendations.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/baby/:babyId', authenticate, RecommendationsController.getByBaby);

export const recommendationRoutes = router;
