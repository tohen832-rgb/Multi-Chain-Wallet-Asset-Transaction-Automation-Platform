import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://treasury:treasury_dev@localhost:5432/treasury',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  vaultMasterKey: process.env.VAULT_MASTER_KEY || '0123456789abcdef0123456789abcdef',
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
};
