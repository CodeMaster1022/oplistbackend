/**
 * MongoDB database configuration
 */

import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('💡 Please create a .env file in the backend directory with MONGODB_URI');
      console.error('💡 Example: MONGODB_URI=mongodb://localhost:27017/restaurant');
      throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file.');
    }

    await mongoose.connect(MONGODB_URI);

    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      // Don't throw if it's just a missing env var - let the user fix it
      throw error;
    }
    throw error;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected');
});

export async function initDatabase() {
  await connectDatabase();
}
