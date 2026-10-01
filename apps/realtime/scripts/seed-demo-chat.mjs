// Insère dans MongoDB le chat de démonstration produit par Laravel :
//   php artisan demo:chat | node scripts/seed-demo-chat.mjs
// Remplace tous les canaux et messages de l'organisation concernée.
import mongoose from 'mongoose';
import { config } from '../src/config.js';
import { Channel } from '../src/models/channel.js';
import { Message } from '../src/models/message.js';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const spec = JSON.parse(await readStdin());
const organizationId = Number(spec.organization_id);
if (!organizationId || !Array.isArray(spec.channels)) {
  console.error('Entrée invalide : attendu la sortie JSON de « php artisan demo:chat ».');
  process.exit(1);
}

await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 });
await Channel.createIndexes();

const now = Date.now();
const at = (minutesAgo) => new Date(now - minutesAgo * 60_000);

await Message.deleteMany({ organization_id: organizationId });
await Channel.deleteMany({ organization_id: organizationId });

let messageCount = 0;
for (const c of spec.channels) {
  const oldest = Math.max(0, ...c.messages.map((m) => m.minutes_ago));
  const channel = await Channel.create({
    organization_id: organizationId,
    type: c.type,
    name: c.name ?? null,
    project_id: c.project_id ?? null,
    member_ids: c.member_ids,
    ...(c.direct_key ? { direct_key: c.direct_key } : {}),
  });

  // Insertion brute : on garde les dates passées (les timestamps Mongoose écraseraient created_at).
  const docs = c.messages.map((m) => {
    const sentAt = at(m.minutes_ago);
    return {
      organization_id: organizationId,
      channel_id: String(channel._id),
      sender_id: m.sender_id,
      body: m.body,
      attachments: [],
      read_by: c.member_ids
        .filter((id) => id === m.sender_id || !m.unread_for.includes(id))
        .map((user_id) => ({ user_id, at: sentAt })),
      created_at: sentAt,
      updated_at: sentAt,
    };
  });
  if (docs.length) await Message.collection.insertMany(docs);
  await Channel.collection.updateOne({ _id: channel._id }, { $set: { created_at: at(oldest + 60), updated_at: at(oldest + 60) } });
  messageCount += docs.length;
}

console.log(`Chat de démo : ${spec.channels.length} canaux, ${messageCount} messages (organisation ${organizationId}).`);
await mongoose.disconnect();
