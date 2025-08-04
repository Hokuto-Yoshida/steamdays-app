// lib/models/Chat.ts
import mongoose from 'mongoose';

export interface IChatMessage {
  _id?: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: Date;
  ipAddress?: string;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>({
  message: { 
    type: String, 
    required: true, 
    maxlength: 500,  // メッセージの最大長制限
    trim: true 
  },
  author: { 
    type: String, 
    required: true,
    maxlength: 50,   // 名前の最大長制限
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
  timestamps: true  // createdAt, updatedAt を自動追加
});

// インデックス: 最新メッセージを効率的に取得
ChatMessageSchema.index({ timestamp: -1 });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);