import { Router } from 'express';
import { RecommendationsController } from './recommendations.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/baby/:babyId', authenticate, RecommendationsController.getByBaby);

export const recommendationRoutes = router;
