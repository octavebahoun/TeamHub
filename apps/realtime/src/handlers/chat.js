import mongoose from 'mongoose';
import { Channel } from '../models/channel.js';
import { Message } from '../models/message.js';
import { organizationMembers } from '../members.js';
import { logger } from '../logger.js';

const HISTORY_LIMIT = 50;

async function assertMember(socket, channelId) {
  if (!mongoose.isValidObjectId(channelId)) return null;
  const channel = await Channel.findOne({
    _id: channelId,
    organization_id: socket.data.currentOrganizationId,
    member_ids: socket.data.user.id,
  }).lean();
  return channel;
}

// L'accusé de réception est toujours le dernier argument (channel:list n'a pas de charge).
const ackOf = (args) => (typeof args.at(-1) === 'function' ? args.at(-1) : undefined);

// Annuaire de l'organisation ; vide si l'API est injoignable (le chat reste utilisable,
// seuls les noms des canaux directs et le canal general en pâtissent).
async function safeMembers(organizationId) {
  try {
    return await organizationMembers(organizationId);
  } catch (err) {
    logger.warn({ msg: err.message, organizationId }, 'organization members lookup failed');
    return [];
  }
}

// Doc « Parcours par rôle » : l'invité n'accède qu'au canal du projet partagé
// avec lui — ni canal general, ni messages privés.
const GUEST = 'guest';

// Canal « general » de l'organisation, créé au besoin ; ses membres suivent l'annuaire.
async function syncGeneralChannel(organizationId, members) {
  if (!members.length) return;
  await Channel.updateOne(
    { organization_id: organizationId, type: 'project', project_id: null, name: 'general' },
    { $set: { member_ids: members.filter((m) => m.role !== GUEST).map((m) => m.id) } },
    { upsert: true },
  );
}

// Format attendu par le frontend : {id, type, name, project_id, member_ids, unread_count,
// last_message_at}. Pour un canal direct, name = nom de l'autre membre.
async function serializeChannels(channels, userId, members) {
  if (!channels.length) return [];

  const ids = channels.map((c) => String(c._id));
  const stats = await Message.aggregate([
    { $match: { organization_id: channels[0].organization_id, channel_id: { $in: ids } } },
    {
      $group: {
        _id: '$channel_id',
        last_message_at: { $max: '$created_at' },
        unread_count: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender_id', userId] },
                  { $not: [{ $in: [userId, { $ifNull: ['$read_by.user_id', []] }] }] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const byChannel = new Map(stats.map((s) => [s._id, s]));
  const names = new Map(members.map((m) => [m.id, m.name]));

  return channels
    .map((c) => {
      const id = String(c._id);
      const otherId = c.type === 'direct' ? c.member_ids.find((m) => m !== userId) : null;
      return {
        id,
        type: c.type,
        name: c.type === 'direct' ? (names.get(otherId) ?? c.name ?? 'Membre') : c.name,
        project_id: c.project_id ?? null,
        member_ids: c.member_ids,
        unread_count: byChannel.get(id)?.unread_count ?? 0,
        last_message_at: byChannel.get(id)?.last_message_at ?? null,
      };
    })
    .sort((a, b) => (b.last_message_at ?? 0) - (a.last_message_at ?? 0));
}

export function registerChatHandlers(io, socket) {
  socket.on('channel:list', async (...args) => {
    const ack = ackOf(args);
    try {
      const organizationId = socket.data.currentOrganizationId;
      const userId = socket.data.user.id;

      const members = await safeMembers(organizationId);
      await syncGeneralChannel(organizationId, members);

      const channels = await Channel.find({
        organization_id: organizationId,
        member_ids: userId,
      }).lean();

      ack?.({ ok: true, channels: await serializeChannels(channels, userId, members) });
    } catch (err) {
      logger.error({ err }, 'channel:list failed');
      ack?.({ ok: false, error: 'server_error' });
    }
  });

  // 50 derniers messages (ordre chronologique). `before` = created_at (ISO) du plus
  // ancien message déjà chargé, pour remonter l'historique.
  socket.on('channel:history', async ({ channel_id, before } = {}, ack) => {
    try {
      const channel = await assertMember(socket, channel_id);
      if (!channel) return ack?.({ ok: false, error: 'not_a_member' });

      const scope = { organization_id: socket.data.currentOrganizationId, channel_id };
      const filter = { ...scope };
      if (before) {
        const date = new Date(before);
        if (Number.isNaN(date.getTime())) return ack?.({ ok: false, error: 'invalid' });
        filter.created_at = { $lt: date };
      }

      const messages = await Message.find(filter)
        .sort({ created_at: -1 })
        .limit(HISTORY_LIMIT)
        .lean();

      // Ouvrir le canal = tout lire : remet unread_count à 0 pour cet utilisateur.
      const userId = socket.data.user.id;
      await Message.updateMany(
        { ...scope, 'read_by.user_id': { $ne: userId } },
        { $push: { read_by: { user_id: userId, at: new Date() } } },
      );

      ack?.({ ok: true, messages: messages.reverse() });
    } catch (err) {
      logger.error({ err }, 'channel:history failed');
      ack?.({ ok: false, error: 'server_error' });
    }
  });

  // Crée (ou retrouve) le canal privé entre l'utilisateur et un autre membre de l'organisation.
  socket.on('channel:direct', async ({ user_id } = {}, ack) => {
    try {
      const organizationId = socket.data.currentOrganizationId;
      const userId = socket.data.user.id;
      const otherId = Number(user_id);
      if (!otherId || otherId === userId) return ack?.({ ok: false, error: 'invalid' });
      if (socket.data.role === GUEST) return ack?.({ ok: false, error: 'forbidden' });

      const members = await organizationMembers(organizationId);
      const other = members.find((m) => m.id === otherId);
      if (!other) return ack?.({ ok: false, error: 'not_a_member' });
      if (other.role === GUEST) return ack?.({ ok: false, error: 'forbidden' });

      const memberIds = [userId, otherId].sort((a, b) => a - b);
      const key = { organization_id: organizationId, type: 'direct', direct_key: memberIds.join(':') };
      let channel;
      try {
        channel = await Channel.findOneAndUpdate(
          key,
          { $setOnInsert: { member_ids: memberIds, project_id: null } },
          { upsert: true, returnDocument: 'after' },
        ).lean();
      } catch (err) {
        // Création simultanée par les deux membres : l'index unique a tranché, on relit.
        if (err.code !== 11000) throw err;
        channel = await Channel.findOne(key).lean();
      }

      const [serialized] = await serializeChannels([channel], userId, members);
      ack?.({ ok: true, channel: serialized });
    } catch (err) {
      logger.error({ err }, 'channel:direct failed');
      ack?.({ ok: false, error: 'server_error' });
    }
  });

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
      if (!channel_id || (!body?.trim() && (!Array.isArray(attachments) || attachments.length === 0))) {
        return ack?.({ ok: false, error: 'invalid' });
      }
      const channel = await assertMember(socket, channel_id);
      if (!channel) return ack?.({ ok: false, error: 'not_a_member' });

      const safeAttachments = (Array.isArray(attachments) ? attachments : [])
        .slice(0, 5)
        .map((a) => ({
          path: typeof a?.path === 'string' && a.path.startsWith('/api/wine/attachments/') ? a.path : '',
          name: String(a?.name ?? 'fichier').slice(0, 255),
          mime: String(a?.mime ?? 'application/octet-stream').slice(0, 100),
          size: Number(a?.size) || 0,
        }))
        .filter((a) => a.path);

      const message = await Message.create({
        organization_id: socket.data.currentOrganizationId,
        channel_id,
        sender_id: socket.data.user.id,
        body: (body ?? '').trim(),
        attachments: safeAttachments,
        // L'expéditeur a lu son propre message (n'entre pas dans son unread_count).
        read_by: [{ user_id: socket.data.user.id, at: new Date() }],
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
