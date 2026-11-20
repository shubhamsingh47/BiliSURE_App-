import { Request, Response, NextFunction } from 'express';
import { ChatsService } from './chats.service';
import { sendSuccess } from '../../common/response';

export class ChatsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const facility = req.user?.facility || (req.query.facility as string) || 'ALL';
      const channel = (req.query.channel as string) || 'general';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const messages = await ChatsService.getMessages(facility, channel, limit);
      sendSuccess(res, messages, 200, 'Chat messages retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, recipientFacility, channel, relatedBabyUhid, relatedReferralId } = req.body;
      const senderFacility = req.user?.facility || 'PGI';
      const senderName = req.user?.email ? req.user.email.split('@')[0].toUpperCase() : 'Hospital Staff';
      const senderRole = req.user?.role || 'receiving_hospital';
      const senderId = req.user?.userId || 'system';

      const created = await ChatsService.sendMessage({
        senderId,
        senderName,
        senderRole,
        senderFacility,
        recipientFacility,
        channel,
        message,
        relatedBabyUhid,
        relatedReferralId,
      });

      sendSuccess(res, created, 201, 'Message sent successfully');
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await ChatsService.markAsRead(id);
      sendSuccess(res, { success: true }, 200, 'Message marked as read');
    } catch (err) {
      next(err);
    }
  }
}
