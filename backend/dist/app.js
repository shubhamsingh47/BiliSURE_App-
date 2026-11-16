"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = require("./modules/auth/auth.routes");
const babies_routes_1 = require("./modules/babies/babies.routes");
const readings_routes_1 = require("./modules/readings/readings.routes");
const recommendations_routes_1 = require("./modules/recommendations/recommendations.routes");
const observations_routes_1 = require("./modules/observations/observations.routes");
const devices_routes_1 = require("./modules/devices/devices.routes");
const analytics_routes_1 = require("./modules/analytics/analytics.routes");
const sync_routes_1 = require("./modules/sync/sync.routes");
function createApp() {
    const app = (0, express_1.default)();
    // Security and standard middlewares
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Health and readiness probes
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
    });
    app.get('/ready', (req, res) => {
        res.status(200).json({ ready: true });
    });
    // Version 1 API routes
    const apiV1 = express_1.default.Router();
    apiV1.use('/auth', auth_routes_1.authRoutes);
    apiV1.use('/babies', babies_routes_1.babyRoutes);
    apiV1.use('/readings', readings_routes_1.readingRoutes);
    apiV1.use('/recommendations', recommendations_routes_1.recommendationRoutes);
    apiV1.use('/observations', observations_routes_1.observationRoutes);
    apiV1.use('/devices', devices_routes_1.deviceRoutes);
    apiV1.use('/analytics', analytics_routes_1.analyticsRoutes);
    apiV1.use('/sync', sync_routes_1.syncRoutes);
    app.use('/api/v1', apiV1);
    // Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
