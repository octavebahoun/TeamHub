import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    organization_id: { type: Number, required: true, index: true },
    channel_id: { type: String, required: true, index: true },
    sender_id: { type: Number, required: true },
    body: { type: String, required: true },
    attachments: [{ path: String, name: String, mime: String, size: Number }],
    read_by: [{ user_id: Number, at: Date }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

messageSchema.index({ organization_id: 1, channel_id: 1, created_at: -1 });

export const Message = mongoose.model('Message', messageSchema);
