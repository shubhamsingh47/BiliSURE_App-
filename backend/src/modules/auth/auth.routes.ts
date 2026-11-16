import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.validator.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.post('/register', validateBody(RegisterSchema), AuthController.register);
router.post('/login', validateBody(LoginSchema), AuthController.login);
router.post('/refresh', validateBody(RefreshTokenSchema), AuthController.refresh);
router.get('/profile', authenticate, AuthController.getProfile);

export const authRoutes = router;
