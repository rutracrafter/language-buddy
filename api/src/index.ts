import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB, closeDB } from './db.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/language_buddy';

async function start() {
  try {
    console.log('Starting Language Buddy API server...');
    await connectDB(MONGO_URL);

    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server is running on http://0.0.0.0:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDB();
        console.log('Server and database connection closed.');
        process.exit(0);
      });

      // Force exit after 10s if stuck
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
