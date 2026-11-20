import { Request, Response, NextFunction } from 'express';
import { ReadingsService } from './readings.service';
import { sendSuccess } from '../../common/response';

export class ReadingsController {
  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const facility = req.user?.facility || (req.query.facility as string);
      const filters = {
        search: req.query.search as string,
        facility,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await ReadingsService.listReadings(filters);
      sendSuccess(res, result.items, 200, 'Readings retrieved successfully', result.pagination);
    } catch (err) {
      next(err);
    }
  }

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
