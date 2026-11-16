import { Request, Response, NextFunction } from 'express';
import { SyncService } from './sync.service.js';
import { sendSuccess } from '../../common/response.js';

export class SyncController {
  static async batch(req: Request, res: Response, next: NextFunction) {
    try {
      const operations = req.body.operations || [];
      const results = await SyncService.processBatch(operations, req.user?.userId);
      sendSuccess(res, results, 200, 'Sync operations processed successfully');
    } catch (err) {
      next(err);
    }
  }
}
