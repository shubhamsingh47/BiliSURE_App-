import dns from 'dns';
import mongoose from 'mongoose';
import { ENV } from './env';

// Ensure SRV DNS resolution succeeds on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom dns servers cannot be set
}

export let isMongoConnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    // Don't buffer commands indefinitely if disconnected
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    isMongoConnected = true;
    console.log(`[Database] Successfully connected to MongoDB at ${ENV.MONGODB_URI}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB connection warning: ${(error as Error).message}. Application will operate with high-speed in-memory fallback persistence.`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isMongoConnected) {
    await mongoose.disconnect();
    isMongoConnected = false;
  }
}
