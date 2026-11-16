"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalRoutes = void 0;
const express_1 = require("express");
const hospitals_controller_1 = require("./hospitals.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
exports.hospitalRoutes = router;
// Public / Authenticated endpoints
router.get('/', hospitals_controller_1.HospitalsController.list);
router.get('/:id', hospitals_controller_1.HospitalsController.getById);
router.get('/:id/stations', hospitals_controller_1.HospitalsController.getStations);
router.post('/:id/stations', auth_1.authenticate, hospitals_controller_1.HospitalsController.createStation);
router.patch('/:id/stations/:stationId/status', auth_1.authenticate, hospitals_controller_1.HospitalsController.updateStationStatus);
router.patch('/:id/pause-referrals', auth_1.authenticate, hospitals_controller_1.HospitalsController.togglePause);
