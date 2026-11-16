"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
async function bootstrap() {
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    const server = app.listen(env_1.ENV.PORT, () => {
        console.log(`[BiliSURE Backend] Server listening on port ${env_1.ENV.PORT} (ENV: ${env_1.ENV.NODE_ENV})`);
        console.log(`[BiliSURE Backend] API V1 mounted at http://localhost:${env_1.ENV.PORT}/api/v1`);
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
