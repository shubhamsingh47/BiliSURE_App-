import { Request, Response, NextFunction } from 'express';
import { HospitalsService } from './hospitals.service';
import { sendSuccess } from '../../common/response';

export class HospitalsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as 'referring_centre' | 'receiving_hospital' | undefined;
      const hospitals = await HospitalsService.listHospitals(type);
      return sendSuccess(res, hospitals, 200, 'Hospitals retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const hospital = await HospitalsService.getHospitalById(String(req.params.id));
      return sendSuccess(res, hospital, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const userFacility = (req as any).user?.facility;
      const userFacilityId = (req as any).user?.facilityId;
      const targetHospitalId = req.params.id || userFacilityId || (userFacility ? `hosp_${userFacility.toLowerCase()}` : undefined);
      const stations = await HospitalsService.getStations(String(targetHospitalId));
      return sendSuccess(res, stations, 200);
    } catch (err) {
      next(err);
    }
  }

  static async createStation(req: Request, res: Response, next: NextFunction) {
    try {
      const station = await HospitalsService.createStation({
        hospitalId: String(req.params.id),
        ...req.body,
      });
      return sendSuccess(res, station, 201, 'Station registered successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, babyId, babyName, babyUhid, notes } = req.body;
      const userFacility = (req as any).user?.facility;
      const userFacilityId = (req as any).user?.facilityId;
      const hospitalId = req.params.id || userFacilityId || (userFacility ? `hosp_${userFacility.toLowerCase()}` : undefined);
      const station = await HospitalsService.updateStationStatus(
        String(req.params.stationId),
        status,
        {
          babyId,
          babyName,
          babyUhid,
          notes,
        },
        hospitalId ? String(hospitalId) : undefined
      );
      return sendSuccess(res, station, 200, `Station status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  static async togglePause(req: Request, res: Response, next: NextFunction) {
    try {
      const { isPaused = true, reason } = req.body;
      const hospital = await HospitalsService.togglePauseReferrals(
        String(req.params.id),
        Boolean(isPaused),
        reason
      );
      return sendSuccess(
        res,
        hospital,
        200,
        isPaused ? 'Incoming referrals paused for this facility' : 'Referral acceptance resumed'
      );
    } catch (err) {
      next(err);
    }
  }
}
