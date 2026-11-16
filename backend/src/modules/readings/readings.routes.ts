import { Router } from 'express';
import { ReadingsController } from './readings.controller';
import { validateBody } from '../../middleware/validate';
import { CreateReadingSchema } from './readings.validator';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/baby/:babyId', authenticate, ReadingsController.getByBaby);
router.get('/baby/:babyId/latest', authenticate, ReadingsController.getLatest);
router.post('/', authenticate, validateBody(CreateReadingSchema), ReadingsController.create);

export const readingRoutes = router;
