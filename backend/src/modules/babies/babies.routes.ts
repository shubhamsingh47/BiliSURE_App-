import { Router } from 'express';
import { BabiesController } from './babies.controller.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { CreateBabySchema, QueryBabySchema } from './babies.validator.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, validateQuery(QueryBabySchema), BabiesController.list);
router.get('/:id', authenticate, BabiesController.getById);
router.post('/', authenticate, validateBody(CreateBabySchema), BabiesController.create);
router.put('/:id', authenticate, BabiesController.update);

export const babyRoutes = router;
