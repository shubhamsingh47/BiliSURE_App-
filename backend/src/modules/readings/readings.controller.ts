import { Request, Response, NextFunction } from 'express';
import { ReadingsService } from './readings.service';
import { sendSuccess } from '../../common/response';

export class ReadingsController {
  static async getByBaby(req: Request, res: Response, next: NextFunction) {
    try {
      const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
      const readings = await ReadingsService.getReadingsForBaby(babyId, req.query.timeRange as string);
      sendSuccess(res, readings, 200, 'Readings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
      const reading = await ReadingsService.getLatestReadingForBaby(babyId);
      sendSuccess(res, reading, 200, 'Latest reading retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const operatorName = req.user?.email ? req.user.email.split('@')[0] : 'Nurse A';
      const reading = await ReadingsService.createReading(req.body, req.user?.userId, operatorName);
      sendSuccess(res, reading, 201, 'Reading recorded successfully');
    } catch (err) {
      next(err);
    }
  }
}
