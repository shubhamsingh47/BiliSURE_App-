import { Request, Response, NextFunction } from 'express';
import { DeviceTestingService } from './deviceTesting.service';
import { BadRequestError } from '../../common/errors';

export class DeviceTestingController {
  static async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const isSuperAdmin = req.user?.role === 'district_admin';
      const facility = isSuperAdmin && req.query.facility ? (req.query.facility as string) : req.user?.facility;
      const devices = await DeviceTestingService.getDevices(facility, isSuperAdmin && !req.query.facility);
      res.status(200).json({ success: true, count: devices.length, data: devices });
    } catch (err) {
      next(err);
    }
  }

  static async runScan(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceSerial, requestedScenario, department } = req.body;
      if (!deviceSerial) {
        throw new BadRequestError('deviceSerial is required to run diagnostics.');
      }
      const facility = req.user?.facility || 'PGI';
      const scannedBy = req.user?.email || 'Clinical Staff';

      const diagnostic = await DeviceTestingService.runScan({
        deviceSerial,
        facility,
        department,
        requestedScenario,
        scannedBy,
      });

      res.status(201).json({
        success: true,
        message: 'Device diagnostic scan completed successfully.',
        data: diagnostic,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const isSuperAdmin = req.user?.role === 'district_admin';
      const facility = isSuperAdmin && req.query.facility ? (req.query.facility as string) : req.user?.facility;
      const deviceSerial = req.query.deviceSerial as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await DeviceTestingService.getHistory({
        facility,
        deviceSerial,
        isSuperAdmin: isSuperAdmin && !req.query.facility,
        page,
        limit,
      });

      res.status(200).json({ success: true, ...history });
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const isSuperAdmin = req.user?.role === 'district_admin';
      const facility = isSuperAdmin && req.query.facility ? (req.query.facility as string) : req.user?.facility;
      const summary = await DeviceTestingService.getSummary(facility, isSuperAdmin && !req.query.facility);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}
