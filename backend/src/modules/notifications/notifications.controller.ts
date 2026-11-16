import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { sendSuccess } from '../../common/response';

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, hospitalId } = req.query as any;
      const list = await NotificationsService.listNotifications(
        role ? String(role) : undefined,
        hospitalId ? String(hospitalId) : undefined
      );
      return sendSuccess(res, list, 200);
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notif = await NotificationsService.markAsRead(String(req.params.id));
      return sendSuccess(res, notif, 200, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const resData = await NotificationsService.markAllAsRead();
      return sendSuccess(res, resData, 200, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}
