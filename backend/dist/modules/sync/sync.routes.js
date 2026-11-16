"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRoutes = void 0;
const express_1 = require("express");
const sync_controller_1 = require("./sync.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.post('/batch', auth_1.authenticate, sync_controller_1.SyncController.batch);
exports.syncRoutes = router;
