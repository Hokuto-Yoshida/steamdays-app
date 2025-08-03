// Edge Runtime対応のため、mongooseインポートを避ける

export enum UserRole {
  ADMIN = 'admin',
  PRESENTER = 'presenter',
  VOTER = 'voter'
}

// 権限チェック用のヘルパー関数（Edge Runtime対応）
export class PermissionHelper {
  static canViewAdminPanel(role: string): boolean {
    return role === UserRole.ADMIN;
  }
  
  static canManageTeams(role: string): boolean {
    return role === UserRole.ADMIN;
  }
  
  static canEditTeam(role: string, userTeamId?: string, targetTeamId?: string): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.PRESENTER && userTeamId === targetTeamId) return true;
    return false;
  }
  
  static canVote(role: string): boolean {
    return [UserRole.VOTER, UserRole.ADMIN].includes(role as UserRole);
  }
  
  static canViewResults(role: string): boolean {
    return true; // 全員が結果を見ることができる
  }
  
  static canCreateUsers(role: string): boolean {
    return role === UserRole.ADMIN;
  }
}