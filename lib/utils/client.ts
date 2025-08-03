// ブラウザ用のユニークID生成
export function generateClientId(): string {
  if (typeof window === 'undefined') {
    return 'server-' + Math.random().toString(36).substring(2, 15);
  }

  // ローカルストレージから既存のIDを取得
  const existingId = localStorage.getItem('steamdays-client-id');
  if (existingId) {
    return existingId;
  }

  // 新しいIDを生成
  const clientId = 'client-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
  
  // ローカルストレージに保存
  localStorage.setItem('steamdays-client-id', clientId);
  
  return clientId;
}

// 投票の重複チェック用
export function hasVotedForTeam(teamId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const votedTeams = JSON.parse(localStorage.getItem('steamdays-voted-teams') || '[]');
  return votedTeams.includes(teamId);
}

export function markTeamAsVoted(teamId: string): void {
  if (typeof window === 'undefined') return;
  
  const votedTeams = JSON.parse(localStorage.getItem('steamdays-voted-teams') || '[]');
  if (!votedTeams.includes(teamId)) {
    votedTeams.push(teamId);
    localStorage.setItem('steamdays-voted-teams', JSON.stringify(votedTeams));
  }
}