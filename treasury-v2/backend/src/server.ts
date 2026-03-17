import 'reflect-metadata';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import { seedDefaultUsers } from './seeds/seed';

async function start() {
  try {
    await connectDatabase();
    logger.info('Database connected');
    await connectRedis();
    logger.info('Redis connected');
    try { await connectRabbitMQ(); } catch (e) { logger.warn('RabbitMQ not available — running without events'); }
    await seedDefaultUsers();
    app.listen(env.port, () => {
      logger.info(`Backend running on port ${env.port}`);
      logger.info(`Health: http://localhost:${env.port}/health`);
      logger.info(`API:    http://localhost:${env.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}
start();
