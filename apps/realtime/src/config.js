import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });

function envValue(file, key) {
  if (!existsSync(file)) return '';
  const line = readFileSync(file, 'utf8').split('\n').find((entry) => entry.startsWith(`${key}=`));
  if (!line) return '';
  return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

if (!process.env.INTERNAL_SECRET) {
  process.env.INTERNAL_SECRET = envValue(path.resolve(here, '../../api/.env'), 'INTERNAL_SECRET');
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://127.0.0.1:8000',
  internalSecret: process.env.INTERNAL_SECRET ?? '',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/wine',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
};
