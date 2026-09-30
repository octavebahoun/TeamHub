import { Channel } from '../models/channel.js';
import { Message } from '../models/message.js';
import { logger } from '../logger.js';

async function assertMember(socket, channelId) {
  const channel = await Channel.findOne({
    _id: channelId,
    organization_id: socket.data.currentOrganizationId,
    member_ids: socket.data.user.id,
  }).lean();
  return channel;
}

export function registerChatHandlers(io, socket) {
  socket.on('channel:join', async (channelId, ack) => {
    try {
      const channel = await assertMember(socket, channelId);
      if (!channel) return ack?.({ ok: false, error: 'not_a_member' });
      socket.join(`channel:${channelId}`);
      ack?.({ ok: true });
    } catch (err) {
      logger.error({ err }, 'channel:join failed');
      ack?.({ ok: false, error: 'server_error' });
    }
  });

  socket.on('message:send', async ({ channel_id, body, attachments = [] } = {}, ack) => {
    try {
      if (!channel_id || !body?.trim()) return ack?.({ ok: false, error: 'invalid' });
      const channel = await assertMember(socket, channel_id);
      if (!channel) return ack?.({ ok: false, error: 'not_a_member' });

      const message = await Message.create({
        organization_id: socket.data.currentOrganizationId,
        channel_id,
        sender_id: socket.data.user.id,
        body: body.trim(),
        attachments,
      });

      io.to(`channel:${channel_id}`).emit('message:new', message.toObject());
      ack?.({ ok: true, id: message._id });
    } catch (err) {
      logger.error({ err }, 'message:send failed');
      ack?.({ ok: false, error: 'server_error' });
    }
  });

  socket.on('message:read', async ({ message_id } = {}) => {
    if (!message_id) return;
    await Message.updateOne(
      { _id: message_id, organization_id: socket.data.currentOrganizationId },
      { $addToSet: { read_by: { user_id: socket.data.user.id, at: new Date() } } },
    );
  });

  socket.on('typing', ({ channel_id } = {}) => {
    if (!channel_id) return;
    socket.to(`channel:${channel_id}`).emit('typing', {
      channel_id,
      user_id: socket.data.user.id,
    });
  });
}
