import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://127.0.0.1:8000',
  internalSecret: process.env.INTERNAL_SECRET ?? '',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/wine',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
};
