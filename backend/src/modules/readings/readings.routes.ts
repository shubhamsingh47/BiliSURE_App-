import { Router } from 'express';
import { ReadingsController } from './readings.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { CreateReadingSchema } from './readings.validator.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/baby/:babyId', authenticate, ReadingsController.getByBaby);
router.get('/baby/:babyId/latest', authenticate, ReadingsController.getLatest);
router.post('/', authenticate, validateBody(CreateReadingSchema), ReadingsController.create);

export const readingRoutes = router;
