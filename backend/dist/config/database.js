"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] Successfully connected to MongoDB at ${env_1.ENV.MONGODB_URI}`);
    }
    catch (error) {
        console.warn(`[Database] MongoDB connection warning: ${error.message}. Application will operate with simulated/fallback persistence where applicable.`);
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
}
