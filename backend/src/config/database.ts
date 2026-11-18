import dns from 'dns';
import mongoose from 'mongoose';
import { ENV } from './env';

// Configure reliable DNS servers for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting servers is restricted
}

export let isMongoConnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    // Don't buffer commands indefinitely if disconnected
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isMongoConnected = true;
    const dbName = mongoose.connection.db?.databaseName || 'BiliSURE';
    console.log(`[Database] Successfully connected to MongoDB database: ${dbName}`);
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
