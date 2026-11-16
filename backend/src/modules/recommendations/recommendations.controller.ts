import { Request, Response, NextFunction } from 'express';
import { RecommendationsService } from './recommendations.service.js';
import { sendSuccess } from '../../common/response.js';

export class RecommendationsController {
  static async getByBaby(req: Request, res: Response, next: NextFunction) {
    try {
      const babyId = Array.isArray(req.params.babyId) ? req.params.babyId[0] : req.params.babyId;
      const bilirubinVal = req.query.bilirubin ? parseFloat(req.query.bilirubin as string) : 10.0;
      const recs = await RecommendationsService.getForBaby(babyId, bilirubinVal);
      sendSuccess(res, recs, 200, 'Recommendations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
