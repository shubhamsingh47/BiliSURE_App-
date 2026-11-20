import { Router } from 'express';
import { ChatsController } from './chats.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, ChatsController.list);
router.post('/', authenticate, ChatsController.create);
router.patch('/:id/read', authenticate, ChatsController.markRead);

export const chatRoutes = router;
