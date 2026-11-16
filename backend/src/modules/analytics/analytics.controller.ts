import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../common/response';

export class AnalyticsController {
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
      const { dataType, dateRange, format } = req.query;
      const csv = await AnalyticsService.generateExportCsv(dataType as string, dateRange as string);

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
