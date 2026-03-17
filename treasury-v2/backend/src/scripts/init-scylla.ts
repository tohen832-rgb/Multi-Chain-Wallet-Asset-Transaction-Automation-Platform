import { closeDatabase, connectDatabase } from '../config/database';
import { logger } from '../config/logger';

async function initScylla() {
  try {
    await connectDatabase();
    logger.info('ScyllaDB keyspace and tables are ready');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize ScyllaDB', error);
    process.exit(1);
  }
}

initScylla();
