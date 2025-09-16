'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface TeamStats {
  id: string;
  name: string;
  title: string;
  hearts: number;
  comments: { reason: string; timestamp: Date; author: string }[];
  members: string[];
  technologies: string[];
  scratchUrl: string;
  status?: string;
  editingAllowed?: boolean;
  sortOrder?: number; // 追加: 表示順序
}

interface UserStats {
  _id: string;
  name: string;
  email: string;
  role: string;
  teamId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminStats {
  totalTeams: number;
  totalVotes: number;
  topTeam: { name: string; hearts: number } | null;
  activeUsers: number;
}

export default function Admin() {
  const [setupStatus, setSetupStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // チーム作成関連のstate
  const [teamCreating, setTeamCreating] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    title: ''
  });

  // ユーザー管理関連のstate
  const [showUserStats, setShowUserStats] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // ドラッグ&ドロップ関連のstate
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'votes' | 'custom'>('votes'); // 投票順 or カスタム順

  // チーム順序更新関数
  const updateTeamOrder = async (newOrder: TeamStats[]) => {
    try {
      setSetupStatus('🔄 チーム順序を更新中...');
      
      const orderData = newOrder.map((team, index) => ({
        id: team.id,
        sortOrder: index
      }));

      const response = await fetch('/api/admin/teams/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: orderData })
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus('✅ チーム順序を更新しました');
        fetchStats(); // 再読み込み
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Team order update error:', error);
      setSetupStatus(`❌ 順序更新に失敗しました: ${error}`);
    }
  };

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    setIsDragging(true);
    setDraggedTeam(teamId);
    e.dataTransfer.effectAllowed = 'move';
    
    // ドラッグ中の視覚効果
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '0.5';
    }
  };

  // ドラッグ終了
  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDraggedTeam(null);
    
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ドロップ
  const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    
    if (!draggedTeam || draggedTeam === dropTargetId) {
      return;
    }

    const draggedIndex = teams.findIndex(team => team.id === draggedTeam);
    const dropIndex = teams.findIndex(team => team.id === dropTargetId);

    if (draggedIndex === -1 || dropIndex === -1) {
      return;
    }

    // 配列を再並び替え
    const newTeams = [...teams];
    const draggedTeamData = newTeams[draggedIndex];
    newTeams.splice(draggedIndex, 1);
    newTeams.splice(dropIndex, 0, draggedTeamData);

    setTeams(newTeams);
    updateTeamOrder(newTeams);
  };

  // ソートモード切り替え
  const toggleSortMode = () => {
    const newMode = sortMode === 'votes' ? 'custom' : 'votes';
    setSortMode(newMode);
    
    if (newMode === 'votes') {
      // 投票数順にソート
      const sortedTeams = [...teams].sort((a, b) => b.hearts - a.hearts);
      setTeams(sortedTeams);
      updateTeamOrder(sortedTeams);
    }
  };

  // 編集権限切り替え関数
  const toggleEditPermission = async (teamId: string, currentStatus: boolean) => {
    if (!confirm(`チーム${teamId}の編集権限を${currentStatus ? '無効' : '有効'}にしますか？\n\n${
      currentStatus ? '発表者による編集ができなくなります。' : '発表者が自分で編集できるようになります。'
    }`)) {
      return;
    }

    try {
      setSetupStatus('🔄 編集権限を変更中...');
      
      const response = await fetch(`/api/teams/${teamId}/edit-permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editingAllowed: !currentStatus
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTeams(teams.map(team => 
          team.id === teamId 
            ? { ...team, editingAllowed: !currentStatus }
            : team
        ));
        
        setSetupStatus(`✅ ${result.message}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Edit permission toggle error:', error);
      setSetupStatus(`❌ 編集権限の変更に失敗しました: ${error}`);
    }
  };

  // チーム削除関数
  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`「${teamName}」を削除しますか？\n\nこの操作は取り消せません。\n投票データも同時に削除されます。`)) {
      return;
    }

    try {
      setSetupStatus('🔄 チーム削除中...');
      
      const response = await fetch(`/api/admin/teams`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ チーム「${teamName}」を削除しました`);
        fetchStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Team deletion error:', error);
      setSetupStatus(`❌ チーム削除に失敗しました: ${error}`);
    }
  };

  // 投票完全リセット関数
  const resetAllVotes = async () => {
    const confirmMessage = `⚠️ 全ての投票データを完全にリセットしますか？\n\n削除される内容:\n・全ての投票履歴\n・全チームの投票数(ハート)\n・全てのコメント\n\nこの操作は取り消せません。\n\n本当に実行しますか？`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    const finalConfirm = prompt('リセットを実行するには "RESET" と入力してください:', '');
    if (finalConfirm !== 'RESET') {
      setSetupStatus('❌ リセットがキャンセルされました');
      return;
    }

    setLoading(true);
    try {
      setSetupStatus('🔄 投票データを完全にリセット中...');
      
      const response = await fetch('/api/reset-all-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ ${result.message}`);
        fetchStats();
      } else {
        throw new Error(result.message || result.error);
      }
    } catch (error) {
      console.error('投票リセットエラー:', error);
      setSetupStatus(`❌ 投票リセットに失敗しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 統計データの取得
  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json();
        if (teamsResult.success && teamsResult.data) {
          let teamsData: TeamStats[] = teamsResult.data;
          
          // ソートモードに応じて並び替え
          if (sortMode === 'custom') {
            teamsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          } else {
            teamsData.sort((a, b) => b.hearts - a.hearts);
          }
          
          setTeams(teamsData);
          
          const totalVotes = teamsData.reduce((sum: number, team: TeamStats) => sum + team.hearts, 0);
          
          let topTeam: { name: string; hearts: number } | null = null;
          if (teamsData.length > 0) {
            const maxHeartsTeam = teamsData.reduce((prev: TeamStats, current: TeamStats) => 
              (prev.hearts > current.hearts) ? prev : current
            );
            topTeam = { name: maxHeartsTeam.name, hearts: maxHeartsTeam.hearts };
          }

          const usersResponse = await fetch('/api/users');
          let activeUsersCount = 0;
          
          if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            if (usersResult.success && usersResult.data) {
              const usersData: UserStats[] = usersResult.data;
              setUsers(usersData);
              activeUsersCount = usersData.filter(u => u.isActive).length;
            }
          }

          const statsData: AdminStats = {
            totalTeams: teamsData.length,
            totalVotes: totalVotes,
            topTeam: topTeam,
            activeUsers: activeUsersCount
          };
          
          setStats(statsData);
        }
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // チーム作成関数
  const createTeam = async () => {
    if (!newTeamData.name) {
      alert('チーム名は必須です');
      return;
    }

    setTeamCreating(true);
    try {
      const newId = (teams.length + 1).toString();
      
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name: newTeamData.name,
          title: newTeamData.title
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ ${result.message}`);
        setNewTeamData({ name: '', title: '' });
        setShowCreateTeam(false);
        fetchStats();
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('Team creation error:', error);
      alert('チーム作成中にエラーが発生しました');
    } finally {
      setTeamCreating(false);
    }
  };

  // ユーザーステータス切り替え
  const toggleUserStatus = async (userId: string, newStatus: boolean) => {
    if (!confirm(`このユーザーを${newStatus ? '有効' : '無効'}にしますか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ ユーザーステータスを${newStatus ? '有効' : '無効'}に変更しました`);
        fetchStats();
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('User status toggle error:', error);
      alert('ステータス変更中にエラーが発生しました');
    }
  };

  // ユーザー削除
  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`「${userName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ ユーザー「${userName}」を削除しました`);
        fetchStats();
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('User deletion error:', error);
      alert('ユーザー削除中にエラーが発生しました');
    }
  };

  // ユーザー詳細表示
  const showUserDetails = (user: UserStats) => {
    const details = [
      `名前: ${user.name}`,
      `メール: ${user.email}`,
      `ロール: ${getRoleDisplayName(user.role)}`,
      user.teamId ? `チーム: ${user.teamId}` : '',
      `ステータス: ${user.isActive ? 'アクティブ' : '無効'}`,
      `登録日: ${new Date(user.createdAt).toLocaleString('ja-JP')}`,
      user.lastLogin ? `最終ログイン: ${new Date(user.lastLogin).toLocaleString('ja-JP')}` : '最終ログイン: 未記録'
    ].filter(Boolean).join('\n');
    
    alert(details);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTeamStatusChange = async (teamId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        setSetupStatus(`✅ ${result.message}`);
        fetchStats();
      } else {
        alert(`ステータス更新に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新中にエラーが発生しました');
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': '🔧 管理者',
      'presenter': '👥 発表者', 
      'voter': '🗳️ 投票者'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'presenter': 'bg-green-100 text-green-800',
      'voter': 'bg-blue-100 text-blue-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = userFilter === 'all' || user.role === userFilter;
    const matchesSearch = userSearch === '' || 
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        title="STEAMDAYS!! 運営管理"
        showBackButton={true}
        backUrl="/"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ステータス表示 */}
        {setupStatus && (
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-400">
            <p className="font-medium">{setupStatus}</p>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">総投票数</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalVotes || 0}</p>
            </div>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">参加チーム数</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalTeams || 0}</p>
            </div>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">登録ユーザー数</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </div>

        {/* 投票完全リセット */}
        <div className="mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ 危険な操作</h3>
                <p className="text-red-700 text-sm mb-1">
                  全ての投票データ（投票履歴・投票数・コメント）を完全に削除します
                </p>
                <p className="text-red-600 text-xs">
                  この操作は取り消せません。明日のテスト前やデータが混乱した時のみ使用してください
                </p>
              </div>
              <button
                onClick={resetAllVotes}
                disabled={loading}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-medium text-gray-900 placeholder-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {loading ? '処理中...' : '投票を完全リセット'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* チーム管理パネル */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-xl font-bold">チーム管理</h2>
              </div>
              
              {/* ソートモード切り替えボタン */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSortMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    sortMode === 'custom' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {sortMode === 'custom' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      カスタム順序モード
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      投票数順
                    </>
                  )}
                </button>
                
                {sortMode === 'custom' && (
                  <div className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    ドラッグして順序変更
                  </div>
                )}
              </div>
            </div>

            {/* チーム作成機能 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowCreateTeam(!showCreateTeam)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新しいチーム作成
                </button>
              </div>

              {showCreateTeam && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-3">新しいチーム作成</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        チーム名 *
                      </label>
                      <input
                        type="text"
                        value={newTeamData.name}
                        onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
                        placeholder="チーム7 - イノベート"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        プロジェクトタイトル
                      </label>                     
                      <input
                        type="text"
                        value={newTeamData.title}
                        onChange={(e) => setNewTeamData({...newTeamData, title: e.target.value})}
                        placeholder="(オプション)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={createTeam}
                      disabled={teamCreating}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                    >
                      {teamCreating ? '作成中...' : 'チーム作成'}
                    </button>
                    <button
                      onClick={() => setShowCreateTeam(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-lg mb-2">チームの登録をお待ちしています</p>
                  <p className="text-sm">上のボタンでチームを作成してください</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div 
                      key={team.id} 
                      className={`border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                        sortMode === 'custom' 
                          ? 'cursor-move hover:shadow-md bg-gray-50' 
                          : 'bg-gray-50'
                      } ${isDragging && draggedTeam === team.id ? 'opacity-50 transform scale-95' : ''}`}
                      draggable={sortMode === 'custom'}
                      onDragStart={(e) => handleDragStart(e, team.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, team.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {/* ドラッグハンドル */}
                            {sortMode === 'custom' && (
                              <svg className="w-4 h-4 text-gray-400 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            )}
                            
                            {/* 順位表示 */}
                            <span className="bg-white px-2 py-1 rounded text-sm font-bold text-gray-600">
                              #{index + 1}
                            </span>
                            
                            {/* トロフィー（投票順の場合のみ） */}
                            {sortMode === 'votes' && (
                              <>
                                {index === 0 && <span className="text-yellow-500">🏆</span>}
                                {index === 1 && <span className="text-gray-400">🥈</span>}
                                {index === 2 && <span className="text-orange-400">🥉</span>}
                              </>
                            )}
                            
                            <h3 className="text-lg font-bold">{team.title}</h3>
                          </div>
                          <p className="text-purple-600 text-sm mb-1">チーム: {team.name}</p>
                          <p className="text-gray-600 text-sm">
                            メンバー: {team.members.join(', ') || '未設定'}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <select
                            value={team.status || 'upcoming'}
                            onChange={(e) => handleTeamStatusChange(team.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                          >
                            <option value="upcoming">開始前</option>
                            <option value="live">ピッチ中</option>
                            <option value="ended">終了</option>
                          </select>
                        </div>
                      </div>

                      {/* ステータスバッジ表示 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.status === 'live' 
                            ? 'bg-red-100 text-red-800 animate-pulse' 
                            : team.status === 'ended'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {team.status === 'live' && '🔴 ライブ中'}
                          {team.status === 'ended' && '⏹️ 終了'}
                          {team.status === 'upcoming' && '⏳ 開始前'}
                        </span>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.editingAllowed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {team.editingAllowed ? '✏️ 編集可能' : '🔒 編集不可'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border mb-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">投票数</p>
                          <p className="text-lg font-semibold">❤️ {team.hearts}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">コメント</p>
                          <p className="text-lg font-semibold">{team.comments.length}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link 
                          href={`/teams/${team.id}`}
                          className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          詳細表示
                        </Link>
                        <Link
                          href={`/teams/${team.id}/edit`}
                          className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          管理者編集
                        </Link>
                        
                        <button
                          onClick={() => toggleEditPermission(team.id, team.editingAllowed || false)}
                          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                            team.editingAllowed
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {team.editingAllowed ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m6-6V7a4 4 0 00-8 0v4m-1 0h10a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                              </svg>
                              編集禁止
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m0-6V9a4 4 0 00-8 0v2m0 6h16" />
                              </svg>
                              編集許可
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteTeam(team.id, team.name)}
                          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ユーザー管理パネル */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h2 className="text-xl font-bold">登録ユーザー管理</h2>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {users.length}名登録済み
                </span>
              </div>
              
              {/* 統計表示トグル */}
              <button
                onClick={() => setShowUserStats(!showUserStats)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                </svg>
                {showUserStats ? '統計を隠す' : '統計を表示'}
              </button>
            </div>

            {/* ユーザー統計パネル */}
            {showUserStats && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">📊 ユーザー統計</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">管理者</p>
                        <p className="text-2xl font-bold text-red-600">
                          {users.filter(u => u.role === 'admin').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm font-bold">🔧</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">発表者</p>
                        <p className="text-2xl font-bold text-green-600">
                          {users.filter(u => u.role === 'presenter').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-bold">👥</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">投票者</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {users.filter(u => u.role === 'voter').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">🗳️</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">アクティブ</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {users.filter(u => u.isActive).length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm font-bold">✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* フィルター・検索バー */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      userFilter === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    全て ({users.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('admin')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      userFilter === 'admin' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔧 管理者 ({users.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('presenter')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      userFilter === 'presenter' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👥 発表者 ({users.filter(u => u.role === 'presenter').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('voter')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      userFilter === 'voter' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🗳️ 投票者 ({users.filter(u => u.role === 'voter').length})
                  </button>
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <input
                    type="text"
                    placeholder="名前・メールで検索..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ユーザー一覧テーブル */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ロール・チーム
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日・ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        管理アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* アバター */}
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            {/* 名前・メール */}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                          {user.teamId && (
                            <div className="text-sm text-purple-600 mt-1">
                              📋 チーム {user.teamId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? '✅ アクティブ' : '❌ 無効'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {/* ステータス切り替え */}
                            <button
                              onClick={() => toggleUserStatus(user._id, !user.isActive)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                user.isActive 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.isActive ? '🔒 無効化' : '🔓 有効化'}
                            </button>
                            
                            {/* 削除ボタン（管理者以外のみ） */}
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => deleteUser(user._id, user.name)}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                🗑️ 削除
                              </button>
                            )}
                            
                            {/* 詳細情報ボタン */}
                            <button
                              onClick={() => showUserDetails(user)}
                              className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              👁️ 詳細
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* 空の状態 */}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-xl mb-2">
                      {userFilter === 'all' 
                        ? 'ユーザーの登録をお待ちしています'
                        : `${getRoleDisplayName(userFilter)}のユーザーが見つかりません`
                      }
                    </p>
                    <p className="text-sm">
                      {userFilter === 'all'
                        ? '参加者が新規登録すると、こちらに表示されます'
                        : 'フィルターを変更するか、検索条件を調整してください'
                      }
                    </p>
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        検索をクリア
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>STEAMDAYS!! - 運営管理システム</p>
          <p>中高生の「好き」と「やりたい」を社会課題解決につなげるプログラム</p>
        </div>
      </div>
    </div>
  );
}