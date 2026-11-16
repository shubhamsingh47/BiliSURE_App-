import { Request, Response, NextFunction } from 'express';
import { ObservationsService } from './observations.service.js';
import { sendSuccess } from '../../common/response.js';

export class ObservationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const babyId = req.query.babyId as string;
      const obs = await ObservationsService.listForBaby(babyId);
      sendSuccess(res, obs, 200, 'Observations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const observerName = req.user?.email ? req.user.email.split('@')[0] : 'Nurse A';
      const obs = await ObservationsService.create(req.body, observerName);
      sendSuccess(res, obs, 201, 'Observation created successfully');
    } catch (err) {
      next(err);
    }
  }
}
