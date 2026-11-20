import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import { authRoutes } from './modules/auth/auth.routes';
import { babyRoutes } from './modules/babies/babies.routes';
import { readingRoutes } from './modules/readings/readings.routes';
import { recommendationRoutes } from './modules/recommendations/recommendations.routes';
import { observationRoutes } from './modules/observations/observations.routes';
import { deviceRoutes } from './modules/devices/devices.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { syncRoutes } from './modules/sync/sync.routes';
import { hospitalRoutes } from './modules/hospitals/hospitals.routes';
import { referralRoutes } from './modules/referrals/referrals.routes';
import { admissionRoutes } from './modules/admissions/admissions.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { districtRoutes } from './modules/district/district.routes';
import { reservationRoutes } from './modules/reservations/reservations.routes';
import { chatRoutes } from './modules/chats/chats.routes';
import { deviceTestingRoutes } from './modules/deviceTesting/deviceTesting.routes';
import { billingRoutes } from './modules/billing/billing.routes';

export function createApp(): express.Application {
  const app = express();

  // Trust reverse proxy (Nginx) for secure IP forwarding & rate limiting
  app.set('trust proxy', 1);

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
  apiV1.use('/hospitals', hospitalRoutes);
  apiV1.use('/referrals', referralRoutes);
  apiV1.use('/admissions', admissionRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/district', districtRoutes);
  apiV1.use('/reservations', reservationRoutes);
  apiV1.use('/chats', chatRoutes);
  apiV1.use('/device-testing', deviceTestingRoutes);
  apiV1.use('/billing', billingRoutes);

  app.use('/api/v1', apiV1);
  app.use('/api', apiV1);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
