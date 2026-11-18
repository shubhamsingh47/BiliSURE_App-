import { Request, Response, NextFunction } from 'express';
import { ReferralsService } from './referrals.service';
import { sendSuccess } from '../../common/response';

export class ReferralsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const referral = await ReferralsService.createReferral(req.body, req.user);
      return sendSuccess(res, referral, 201, 'Referral created and hospital notified');
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospitalId, centreName, status, type } = req.query as any;
      const userFacility = req.user?.facility;
      const referrals = await ReferralsService.listReferrals(
        {
          hospitalId: hospitalId ? String(hospitalId) : undefined,
          centreName: centreName ? String(centreName) : undefined,
          type: type ? (String(type) as any) : undefined,
          status,
        },
        userFacility
      );
      return sendSuccess(res, referrals, 200, 'Referrals retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const referral = await ReferralsService.getById(String(req.params.id));
      return sendSuccess(res, referral, 200);
    } catch (err) {
      next(err);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorName = (req as any).user?.name || req.body.doctorName || 'Dr. Hospital Paediatrician';
      const referral = await ReferralsService.acceptReferral(String(req.params.id), doctorName);
      return sendSuccess(res, referral, 200, 'Referral accepted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, doctorName } = req.body;
      const referral = await ReferralsService.rejectReferral(
        String(req.params.id),
        String(reason),
        doctorName || (req as any).user?.name || 'Dr. Hospital Paediatrician'
      );
      return sendSuccess(res, referral, 200, 'Referral declined with reason recorded');
    } catch (err) {
      next(err);
    }
  }

  static async clarify(req: Request, res: Response, next: NextFunction) {
    try {
      const { question, doctorName } = req.body;
      const referral = await ReferralsService.requestClarification(
        String(req.params.id),
        String(question),
        doctorName || 'Dr. Hospital Paediatrician'
      );
      return sendSuccess(res, referral, 200, 'Clarification requested from referring centre');
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, cancelledBy } = req.body;
      const referral = await ReferralsService.cancelReferral(
        String(req.params.id),
        String(reason || 'Patient transferred locally'),
        cancelledBy || 'Referring Doctor'
      );
      return sendSuccess(res, referral, 200, 'Referral cancelled');
    } catch (err) {
      next(err);
    }
  }

  static async reRefer(req: Request, res: Response, next: NextFunction) {
    try {
      const { newHospitalId, doctorName } = req.body;
      const referral = await ReferralsService.reRefer(
        String(req.params.id),
        String(newHospitalId),
        doctorName || 'Dr. Referring Doctor'
      );
      return sendSuccess(res, referral, 201, 'Re-referral dispatched to new receiving facility');
    } catch (err) {
      next(err);
    }
  }
}
