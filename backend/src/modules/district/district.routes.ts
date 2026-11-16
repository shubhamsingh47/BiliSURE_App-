import { Router } from 'express';
import { DistrictController } from './district.controller';

const router = Router();

router.get('/overview', DistrictController.getOverview);

export { router as districtRoutes };
