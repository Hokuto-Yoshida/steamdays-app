import mongoose from 'mongoose';

export interface IComment {
  reason: string;
  timestamp: Date;
  author: string;
  ipAddress?: string;
}

export interface ITeam {
  _id?: string;
  id: string;
  name: string;
  title: string;
  description: string;
  challenge: string;
  approach: string;
  members: string[];
  technologies: string[];
  scratchUrl?: string;
  imageUrl?: string;
  hearts: number;
  comments: IComment[];
  status?: string;
  editingAllowed?: boolean; // 🆕 編集権限フラグを追加
  createdAt?: Date;
  updatedAt?: Date;
}

const CommentSchema = new mongoose.Schema<IComment>({
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  author: { type: String, default: '匿名ユーザー' },
  ipAddress: { type: String }
});

const TeamSchema = new mongoose.Schema<ITeam>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  challenge: { type: String, required: true },
  approach: { type: String, required: true },
  members: [{ type: String, required: true }],
  technologies: [{ type: String, required: true }],
  scratchUrl: { type: String },
  imageUrl: { type: String },
  hearts: { type: Number, default: 0 },
  comments: [CommentSchema],
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended'],
    default: 'upcoming'
  },
  editingAllowed: { // 🆕 編集権限フラグ
    type: Boolean,
    default: false // デフォルトは編集不可（安全優先）
  }
}, {
  timestamps: true
});

export const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

// 投票記録用のモデル（重複投票防止）
export interface IVote {
  teamId: string;
  ipAddress: string;
  clientId?: string;
  timestamp: Date;
  reason?: string;
}

const VoteSchema = new mongoose.Schema<IVote>({
  teamId: { type: String, required: true },
  ipAddress: { type: String, required: true },
  clientId: { type: String },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String }
});

// 一意制約：同じIPアドレスまたはクライアントIDから同じチームへは1回のみ投票可能
VoteSchema.index({ teamId: 1, ipAddress: 1 }, { unique: true });
VoteSchema.index({ teamId: 1, clientId: 1 }, { unique: true, sparse: true });

export const Vote = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);