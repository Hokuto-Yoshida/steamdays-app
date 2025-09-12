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

// 全体で投票済みかどうかをチェック（1人1回制限）
export function hasVotedOverall(): boolean {
  if (typeof window === 'undefined') return false;
  
  const votedData = localStorage.getItem('steamdays-user-vote');
  return votedData !== null;
}

// 特定のチームに投票済みかどうかをチェック（後方互換性のため）
export function hasVotedForTeam(teamId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const votedData = localStorage.getItem('steamdays-user-vote');
  if (!votedData) return false;
  
  try {
    const voteInfo = JSON.parse(votedData);
    return voteInfo.teamId === teamId;
  } catch {
    return false;
  }
}

// 投票先チームを記録（1人1回のため、前の投票は上書き）
export function markTeamAsVoted(teamId: string): void {
  if (typeof window === 'undefined') return;
  
  const voteInfo = {
    teamId: teamId,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('steamdays-user-vote', JSON.stringify(voteInfo));
}

// 投票済みのチーム情報を取得
export function getVotedTeamInfo(): { teamId: string; timestamp: string } | null {
  if (typeof window === 'undefined') return null;
  
  const votedData = localStorage.getItem('steamdays-user-vote');
  if (!votedData) return null;
  
  try {
    return JSON.parse(votedData);
  } catch {
    return null;
  }
}

// 投票データをクリア（開発・テスト用）
export function clearVoteData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('steamdays-user-vote');
  localStorage.removeItem('steamdays-voted-teams'); // 旧形式もクリア
}

// 旧形式のデータを新形式に移行
export function migrateVoteData(): void {
  if (typeof window === 'undefined') return;
  
  // 既に新形式データがあれば何もしない
  if (localStorage.getItem('steamdays-user-vote')) return;
  
  // 旧形式データをチェック
  const oldVotedTeams = localStorage.getItem('steamdays-voted-teams');
  if (oldVotedTeams) {
    try {
      const teams = JSON.parse(oldVotedTeams);
      if (teams.length > 0) {
        // 最初に投票したチームを新形式で保存
        markTeamAsVoted(teams[0]);
      }
    } catch {
      // パース失敗時は何もしない
    }
  }
}