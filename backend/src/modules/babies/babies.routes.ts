import { Router } from 'express';
import { BabiesController } from './babies.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { CreateBabySchema, QueryBabySchema } from './babies.validator';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, validateQuery(QueryBabySchema), BabiesController.list);
router.get('/:id', authenticate, BabiesController.getById);
router.post('/', authenticate, validateBody(CreateBabySchema), BabiesController.create);
router.put('/:id', authenticate, BabiesController.update);
router.patch('/:id', authenticate, BabiesController.update);

export const babyRoutes = router;
