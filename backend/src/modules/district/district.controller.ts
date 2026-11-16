import { Request, Response, NextFunction } from 'express';
import { DistrictService } from './district.service';
import { sendSuccess } from '../../common/response';

export class DistrictController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await DistrictService.getOverview();
      return sendSuccess(res, overview, 200, 'District statistics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
