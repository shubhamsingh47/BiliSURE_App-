import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection warning: ${(error as Error).message}. Application will operate with simulated/fallback persistence where applicable.`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
