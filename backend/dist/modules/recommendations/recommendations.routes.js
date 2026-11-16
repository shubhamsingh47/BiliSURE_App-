"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationRoutes = void 0;
const express_1 = require("express");
const recommendations_controller_1 = require("./recommendations.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/baby/:babyId', auth_1.authenticate, recommendations_controller_1.RecommendationsController.getByBaby);
exports.recommendationRoutes = router;
