import mongoose from 'mongoose';

// ユーザーの役割を定義
export enum UserRole {
  ADMIN = 'admin',        // 運営（全権限）
  PRESENTER = 'presenter', // ピッチする人（自分のチーム管理）
  VOTER = 'voter'         // 投票する人（投票のみ）
}

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  teamId?: string;        // プレゼンターの場合、所属チームID
  isActive: boolean;      // アカウントの有効/無効
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.VOTER,
    required: true
  },
  teamId: { 
    type: String,
    required: function(this: IUser) {
      return this.role === UserRole.PRESENTER;
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  }
}, {
  timestamps: true
});

// インデックス作成
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ teamId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// 権限チェック用のヘルパー関数
export class PermissionHelper {
  static canViewAdminPanel(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
  
  static canManageTeams(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
  
  static canEditTeam(role: UserRole, userTeamId?: string, targetTeamId?: string): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.PRESENTER && userTeamId === targetTeamId) return true;
    return false;
  }
  
  static canVote(role: UserRole): boolean {
    return [UserRole.VOTER, UserRole.ADMIN].includes(role);
  }
  
  static canViewResults(role: UserRole): boolean {
    return true; // 全員が結果を見ることができる
  }
  
  static canCreateUsers(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
}