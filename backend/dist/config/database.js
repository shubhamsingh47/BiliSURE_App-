"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoConnected = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
exports.isMongoConnected = false;
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        // Don't buffer commands indefinitely if disconnected
        mongoose_1.default.set('bufferCommands', false);
        await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000,
        });
        exports.isMongoConnected = true;
        console.log(`[Database] Successfully connected to MongoDB at ${env_1.ENV.MONGODB_URI}`);
    }
    catch (error) {
        exports.isMongoConnected = false;
        console.warn(`[Database] MongoDB connection warning: ${error.message}. Application will operate with high-speed in-memory fallback persistence.`);
    }
}
async function disconnectDatabase() {
    if (exports.isMongoConnected) {
        await mongoose_1.default.disconnect();
        exports.isMongoConnected = false;
    }
}
