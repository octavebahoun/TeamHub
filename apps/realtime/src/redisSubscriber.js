import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

const NOTIFICATIONS = 'wine:notifications';
const USER_REVOKED = 'wine:user:revoked';

export function startRedisSubscriber(io) {
  const sub = new Redis(config.redisUrl);

  sub.subscribe(NOTIFICATIONS, USER_REVOKED, (err, count) => {
    if (err) logger.error({ err }, 'redis subscribe failed');
    else logger.info(`Subscribed to ${count} Redis channels`);
  });

  sub.on('message', (channel, raw) => {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return logger.warn({ raw }, 'invalid Redis payload');
    }

    if (channel === NOTIFICATIONS) {
      if (payload.user_id) {
        io.to(`user:${payload.user_id}`).emit('notification:new', payload);
      } else if (payload.organization_id) {
        io.to(`org:${payload.organization_id}`).emit('notification:new', payload);
      }
    } else if (channel === USER_REVOKED) {
      const room = `user:${payload.user_id}`;
      io.in(room).disconnectSockets(true);
      logger.info({ user_id: payload.user_id }, 'user revoked, sockets closed');
    }
  });

  return sub;
}
