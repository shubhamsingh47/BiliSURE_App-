import { Request, Response, NextFunction } from 'express';
import { DevicesService } from './devices.service';
import { sendSuccess } from '../../common/response';

export class DevicesController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await DevicesService.getDeviceProfile();
      sendSuccess(res, profile, 200, 'Device profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await DevicesService.updateCalibrationSettings(req.body);
      sendSuccess(res, updated, 200, 'Device settings updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async calibrate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DevicesService.triggerCalibration();
      sendSuccess(res, result, 200, 'Device calibrated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async diagnostics(req: Request, res: Response, next: NextFunction) {
    try {
      const diag = await DevicesService.getDiagnostics();
      sendSuccess(res, diag, 200, 'Diagnostics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
