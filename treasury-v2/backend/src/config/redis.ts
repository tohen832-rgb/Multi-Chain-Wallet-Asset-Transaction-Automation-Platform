import Redis from 'ioredis';
import { env } from './env';
let redis: Redis;
export function getRedis(): Redis {
  if (!redis) redis = new Redis(env.redisUrl);
  return redis;
}
export async function connectRedis() { const r = getRedis(); await r.ping(); }
