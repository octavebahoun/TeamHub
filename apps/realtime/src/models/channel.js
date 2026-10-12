import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    organization_id: { type: Number, required: true, index: true },
    type: { type: String, enum: ['project', 'direct'], required: true },
    project_id: { type: Number, default: null },
    member_ids: { type: [Number], default: [] },
    name: { type: String, default: null },
    // Canal direct : "petitId:grandId", unique par organisation (évite les doublons
    // si les deux membres ouvrent la conversation en même temps).
    direct_key: { type: String, default: undefined },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

channelSchema.index({ organization_id: 1, member_ids: 1 });
channelSchema.index(
  { organization_id: 1, direct_key: 1 },
  { unique: true, partialFilterExpression: { direct_key: { $type: 'string' } } },
);

export const Channel = mongoose.model('Channel', channelSchema);
