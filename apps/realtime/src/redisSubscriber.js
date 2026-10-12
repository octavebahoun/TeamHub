import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';
import { Channel } from './models/channel.js';

const NOTIFICATIONS = 'wine:notifications';
const USER_REVOKED = 'wine:user:revoked';
const PROJECT_EVENTS = 'wine:project:events';

async function syncProjectChannel(payload) {
  const { action, organization_id, project_id, payload: data = {} } = payload;
  const member_ids = data.member_ids ?? [];

  if (action === 'project.created' || action === 'project.members_changed') {
    await Channel.updateOne(
      { organization_id, project_id, type: 'project' },
      {
        $setOnInsert: { organization_id, project_id, type: 'project' },
        $set: { name: data.name, member_ids },
      },
      { upsert: true },
    );
  } else if (action === 'project.deleted') {
    await Channel.deleteOne({ organization_id, project_id, type: 'project' });
  }
}

export async function handleRedisMessage(io, channel, raw) {
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
    return;
  }
  if (channel === USER_REVOKED) {
    io.in(`user:${payload.user_id}`).disconnectSockets(true);
    logger.info({ user_id: payload.user_id }, 'user revoked, sockets closed');
    return;
  }
  if (channel === PROJECT_EVENTS) {
    await syncProjectChannel(payload);
  }
}

export function startRedisSubscriber(io) {
  const sub = new Redis(config.redisUrl);

  sub.subscribe(NOTIFICATIONS, USER_REVOKED, PROJECT_EVENTS, (err, count) => {
    if (err) logger.error({ err }, 'redis subscribe failed');
    else logger.info(`Subscribed to ${count} Redis channels`);
  });

  sub.on('message', async (channel, raw) => {
    try {
      await handleRedisMessage(io, channel, raw);
    } catch (err) {
      logger.error({ err, channel }, 'Redis handler failed');
    }
  });

  return sub;
}
