import dotenv from 'dotenv';
import type { StringValue } from 'ms';
dotenv.config({ path: '../.env' });
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  scyllaContactPoints: (process.env.SCYLLA_CONTACT_POINTS || 'localhost')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
  scyllaPort: parseInt(process.env.SCYLLA_PORT || '9042'),
  scyllaDatacenter: process.env.SCYLLA_DATACENTER || 'datacenter1',
  scyllaKeyspace: process.env.SCYLLA_KEYSPACE || 'treasury',
  scyllaReplicationFactor: parseInt(process.env.SCYLLA_REPLICATION_FACTOR || '1'),
  scyllaUsername: process.env.SCYLLA_USERNAME || '',
  scyllaPassword: process.env.SCYLLA_PASSWORD || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,
  refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as StringValue,
  vaultMasterKey: process.env.VAULT_MASTER_KEY || '0123456789abcdef0123456789abcdef',
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
};
