// lib/models/TeamChat.ts
import mongoose from 'mongoose';

export interface ITeamChatMessage {
  _id?: string;
  teamId: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: Date;
  ipAddress?: string;
}

const TeamChatMessageSchema = new mongoose.Schema<ITeamChatMessage>({
  teamId: { 
    type: String, 
    required: true,
    index: true  // チーム別の高速検索用
  },
  message: { 
    type: String, 
    required: true, 
    maxlength: 500,
    trim: true 
  },
  author: { 
    type: String, 
    required: true,
    maxlength: 50,
    trim: true 
  },
  authorEmail: { 
    type: String,
    trim: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  }
}, {
  timestamps: true
});

// 複合インデックス: チーム別 + 時系列順でメッセージを効率的に取得
TeamChatMessageSchema.index({ teamId: 1, timestamp: -1 });

export const TeamChatMessage = mongoose.models.TeamChatMessage || mongoose.model<ITeamChatMessage>('TeamChatMessage', TeamChatMessageSchema);