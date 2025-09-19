// lib/models/VotingSettings.ts
import mongoose from 'mongoose';

const VotingSettingsSchema = new mongoose.Schema({
  isVotingOpen: {
    type: Boolean,
    default: true,
    required: true
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 設定は1つのドキュメントのみ存在させる
VotingSettingsSchema.index({}, { unique: true });

export default mongoose.models.VotingSettings || mongoose.model('VotingSettings', VotingSettingsSchema);