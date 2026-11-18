import { createApp } from './app';
import { connectDatabase } from './config/database';
import { seedDefaultUsers } from './config/seedUsers';
import { ENV } from './config/env';

async function bootstrap() {
  await connectDatabase();
  await seedDefaultUsers();
  const app = createApp();

  const server = app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`[BiliSURE Backend] Server listening on port ${ENV.PORT} (ENV: ${ENV.NODE_ENV})`);
    console.log(`[BiliSURE Backend] API V1 mounted at http://localhost:${ENV.PORT}/api/v1`);
  });

  const shutdown = async () => {
    console.log('[BiliSURE Backend] Gracefully shutting down...');
    server.close(() => {
      console.log('[BiliSURE Backend] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('[BiliSURE Backend] Failed to start:', err);
  process.exit(1);
});
