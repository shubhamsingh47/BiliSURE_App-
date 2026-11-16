import { Request, Response, NextFunction } from 'express';
import { AdmissionsService } from './admissions.service';
import { sendSuccess } from '../../common/response';

export class AdmissionsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospitalId, status } = req.query as any;
      const admissions = await AdmissionsService.listAdmissions({
        hospitalId: hospitalId ? String(hospitalId) : undefined,
        status: status ? String(status) : undefined,
      });
      return sendSuccess(res, admissions, 200, 'Admissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionsService.getById(String(req.params.id));
      return sendSuccess(res, admission, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getByBabyId(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await AdmissionsService.getByBabyId(String(req.params.babyId));
      return sendSuccess(res, admission, 200);
    } catch (err) {
      next(err);
    }
  }

  static async confirmArrival(req: Request, res: Response, next: NextFunction) {
    try {
      const nurseName = (req as any).user?.name || req.body.nurseName || 'Nurse Staff';
      const result = await AdmissionsService.confirmArrival({
        referralId: String(req.body.referralId),
        nurseName,
        hospitalId: String(req.body.hospitalId),
      });
      return sendSuccess(res, result, 201, 'Physical arrival confirmed & admission created');
    } catch (err) {
      next(err);
    }
  }

  static async allocateStation(req: Request, res: Response, next: NextFunction) {
    try {
      const nurseName = (req as any).user?.name || req.body.nurseName || 'Nurse Staff';
      const result = await AdmissionsService.allocateStation({
        admissionId: String(req.params.id),
        stationId: String(req.body.stationId),
        nurseName,
      });
      return sendSuccess(res, result, 200, 'PT Station allocated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const nurseName = (req as any).user?.name || req.body.nurseName || 'Nurse Staff';
      const result = await AdmissionsService.startTreatmentSession(String(req.params.id), {
        phototherapyType: req.body.phototherapyType,
        irradianceMwCm2: req.body.irradianceMwCm2,
        nurseName,
        notes: req.body.notes,
      });
      return sendSuccess(res, result, 200, 'Phototherapy treatment session started');
    } catch (err) {
      next(err);
    }
  }

  static async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const nurseName = (req as any).user?.name || req.body.nurseName || 'Nurse Staff';
      const result = await AdmissionsService.endTreatmentSession(String(req.params.id), String(req.params.sessionId), {
        nurseName,
        notes: req.body.notes,
      });
      return sendSuccess(res, result, 200, 'Treatment session concluded and duration recorded');
    } catch (err) {
      next(err);
    }
  }

  static async completeDischarge(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorName = (req as any).user?.name || req.body.doctorName || 'Dr. Hospital Paediatrician';
      const result = await AdmissionsService.completeDischarge(String(req.params.id), {
        doctorName,
        dischargeBilirubinValue: Number(req.body.dischargeBilirubinValue),
        dischargeNotes: req.body.dischargeNotes,
        followUpPlan: req.body.followUpPlan,
      });
      return sendSuccess(res, result, 200, 'Discharge finalized and station released to cleaning/prep');
    } catch (err) {
      next(err);
    }
  }
}
