import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { BadRequestError } from '../../common/errors';

export class BillingController {
  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await BillingService.getPlans();
      res.status(200).json({ success: true, count: plans.length, data: plans });
    } catch (err) {
      next(err);
    }
  }

  static async getHospitalSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const facility = req.user?.facility || 'PGI';
      const data = await BillingService.getHospitalSubscription(facility);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getUsageHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const isSuperAdmin = req.user?.role === 'district_admin';
      const facility = isSuperAdmin && req.query.facility ? (req.query.facility as string) : req.user?.facility;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await BillingService.getUsageHistory({
        facility,
        isSuperAdmin: isSuperAdmin && !req.query.facility,
        page,
        limit,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async selectPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.body;
      if (!planId) {
        throw new BadRequestError('planId is required');
      }
      const facility = req.user?.facility || 'PGI';
      const result = await BillingService.selectPlan(facility, planId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSuperAdminSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await BillingService.getSuperAdminSummary();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
