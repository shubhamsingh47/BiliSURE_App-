import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../common/response';

export class AnalyticsController {
  static async getHospitalOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const facility = req.user?.facility || (req.query.facility as string) || 'PGI';
      const overview = await AnalyticsService.getHospitalOverview(facility);
      sendSuccess(res, overview, 200, 'Hospital overview retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSuperAdminOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const facilityFilter = (req.query.facility as string) || 'All';
      const overview = await AnalyticsService.getSuperAdminOverview(facilityFilter);
      sendSuccess(res, overview, 200, 'Super admin overview retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'Day';
      const summary = await AnalyticsService.getSummaryTotal(period);
      sendSuccess(res, summary, 200, 'Summary analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStories(req: Request, res: Response, next: NextFunction) {
    try {
      const stories = await AnalyticsService.getStoryInsights();
      sendSuccess(res, stories, 200, 'Stories retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const { facility, format } = req.query;
      const userFacility = req.user?.facility || (facility as string);
      const csv = await AnalyticsService.generateRealExportCsv(userFacility);

      if (format === 'json') {
        sendSuccess(res, { csvContent: csv }, 200);
        return;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bilisure_export_${Date.now()}.csv`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
