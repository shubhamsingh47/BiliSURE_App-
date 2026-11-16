"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtRoutes = void 0;
const express_1 = require("express");
const district_controller_1 = require("./district.controller");
const router = (0, express_1.Router)();
exports.districtRoutes = router;
router.get('/overview', district_controller_1.DistrictController.getOverview);
