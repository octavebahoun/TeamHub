import mongoose from 'mongoose';
import { Channel } from '../models/channel.js';
import { Message } from '../models/message.js';

export async function searchMessages({ organizationId, userId, q }) {
  if (!q || !mongoose.connection.readyState) return [];
  const channels = await Channel.find({
    organization_id: organizationId,
    member_ids: userId,
  }).select('_id name project_id').lean();
  if (!channels.length) return [];
  const byId = new Map(channels.map((c) => [String(c._id), c]));
  const hits = await Message.find({
    organization_id: organizationId,
    channel_id: { $in: [...byId.keys()] },
    body: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  })
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  return hits.map((m) => {
    const channel = byId.get(String(m.channel_id));
    return {
      id: String(m._id),
      body: m.body,
      channel: 'chat',
      channel_id: String(m.channel_id),
      client_id: null,
      client_name: channel?.name ?? 'Chat',
      href: channel?.project_id ? `/chat?projet=${channel.project_id}` : `/chat?canal=${m.channel_id}`,
    };
  });
}
