import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.validator';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', validateBody(RegisterSchema), AuthController.register);
router.post('/login', validateBody(LoginSchema), AuthController.login);
router.post('/refresh', validateBody(RefreshTokenSchema), AuthController.refresh);
router.get('/profile', authenticate, AuthController.getProfile);

export const authRoutes = router;
