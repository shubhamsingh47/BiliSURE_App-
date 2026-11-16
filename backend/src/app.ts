import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { babyRoutes } from './modules/babies/babies.routes.js';
import { readingRoutes } from './modules/readings/readings.routes.js';
import { recommendationRoutes } from './modules/recommendations/recommendations.routes.js';
import { observationRoutes } from './modules/observations/observations.routes.js';
import { deviceRoutes } from './modules/devices/devices.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Security and standard middlewares
  app.use(helmet());
  app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health and readiness probes
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.get('/ready', (req, res) => {
    res.status(200).json({ ready: true });
  });

  // Version 1 API routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/babies', babyRoutes);
  apiV1.use('/readings', readingRoutes);
  apiV1.use('/recommendations', recommendationRoutes);
  apiV1.use('/observations', observationRoutes);
  apiV1.use('/devices', deviceRoutes);
  apiV1.use('/analytics', analyticsRoutes);
  apiV1.use('/sync', syncRoutes);

  app.use('/api/v1', apiV1);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
