import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    organization_id: { type: Number, required: true, index: true },
    type: { type: String, enum: ['project', 'direct'], required: true },
    project_id: { type: Number, default: null },
    member_ids: { type: [Number], default: [] },
    name: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

channelSchema.index({ organization_id: 1, member_ids: 1 });

export const Channel = mongoose.model('Channel', channelSchema);
