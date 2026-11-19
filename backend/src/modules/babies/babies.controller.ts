import { Request, Response, NextFunction } from 'express';
import { BabiesService } from './babies.service';
import { sendSuccess } from '../../common/response';

export class BabiesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        department: req.query.department as string,
        severityState: req.query.severityState as string,
        status: req.query.status as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const userFacility = req.user?.facility || (req.query.hospital as string);
      const result = await BabiesService.listBabies(filters, userFacility);
      sendSuccess(res, result.items, 200, 'Babies retrieved successfully', result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const baby = await BabiesService.getBabyById(id, req.user?.facility);
      sendSuccess(res, baby, 200, 'Baby profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const baby = await BabiesService.createBaby(req.body, req.user);
      sendSuccess(res, baby, 201, 'Baby registered successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const baby = await BabiesService.updateBaby(id, req.body);
      sendSuccess(res, baby, 200, 'Baby updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
