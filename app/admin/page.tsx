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
  sortOrder?: number;
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

interface VotingSettings {
  isVotingOpen: boolean;
  closedAt?: Date;
  openedAt?: Date;
}

export default function Admin() {
  const [setupStatus, setSetupStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [votingSettings, setVotingSettings] = useState<VotingSettings>({
    isVotingOpen: true
  });
  
  // チーム作成関連
  const [teamCreating, setTeamCreating] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    title: ''
  });

  // 投票設定取得
  const fetchVotingSettings = async () => {
    try {
      // 既存のAPIから投票設定を取得（まずは固定値で）
      setVotingSettings({
        isVotingOpen: true  // デフォルトは受付中
      });
    } catch (error) {
      console.error('投票設定取得エラー:', error);
    }
  };

  // Admin.tsx の toggleVoting 関数を修正
  const toggleVoting = async () => {
    const action = votingSettings.isVotingOpen ? '締め切り' : '再開';
    const confirmMessage = `投票を${action}しますか？`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      setSetupStatus(`🔄 投票を${action}中...`);
      
      const response = await fetch('/api/admin/teams', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateVotingSettings',
          isVotingOpen: !votingSettings.isVotingOpen
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setVotingSettings({
          isVotingOpen: !votingSettings.isVotingOpen,
          [!votingSettings.isVotingOpen ? 'openedAt' : 'closedAt']: new Date()
        });
        setSetupStatus(`✅ ${result.message}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('投票設定更新エラー:', error);
      setSetupStatus(`❌ 投票${action}に失敗しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // チーム順序更新関数
  const updateTeamOrder = async (newOrder: TeamStats[]) => {
    try {
      setSetupStatus('🔄 チーム順序を更新中...');
      
      const orderData = newOrder.map((team, index) => ({
        id: team.id,
        sortOrder: index
      }));

      console.log('送信する順序データ:', orderData);

      const response = await fetch('/api/admin/teams/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: orderData })
      });

      const result = await response.json();
      console.log('API レスポンス:', result);
      
      if (result.success) {
        const updatedTeams = newOrder.map((team, index) => ({
          ...team,
          sortOrder: index
        }));
        setTeams(updatedTeams);
        setSetupStatus(`✅ チーム順序を更新しました (${result.modifiedCount}件)`);
        
        setTimeout(() => {
          fetchData();
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Team order update error:', error);
      setSetupStatus(`❌ 順序更新に失敗しました: ${error}`);
      fetchData();
    }
  };

  // 上に移動
  const moveTeamUp = (index: number) => {
    if (index === 0) return; // 最上位の場合は何もしない
    
    const newTeams = [...teams];
    [newTeams[index], newTeams[index - 1]] = [newTeams[index - 1], newTeams[index]];
    updateTeamOrder(newTeams);
  };

  // 下に移動
  const moveTeamDown = (index: number) => {
    if (index === teams.length - 1) return; // 最下位の場合は何もしない
    
    const newTeams = [...teams];
    [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
    updateTeamOrder(newTeams);
  };

  // データ取得
  const fetchData = async () => {
    try {
      // チームデータ取得
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json();
        if (teamsResult.success && teamsResult.data) {
          let teamsData: TeamStats[] = teamsResult.data;
          // sortOrderでソート、未設定の場合は作成順（id順）
          teamsData.sort((a, b) => {
            const aOrder = a.sortOrder !== undefined ? a.sortOrder : parseInt(a.id) || 999;
            const bOrder = b.sortOrder !== undefined ? b.sortOrder : parseInt(b.id) || 999;
            return aOrder - bOrder;
          });
          setTeams(teamsData);
          console.log('取得したチームデータ:', teamsData.map(t => ({ id: t.id, name: t.name, sortOrder: t.sortOrder })));
        }
      }

      // ユーザーデータ取得
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data);
        }
      }
    } catch (error) {
      console.error('Data fetch error:', error);
    }
  };

  // チーム作成
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
        fetchData();
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

  // チーム削除
  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`「${teamName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
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
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Team deletion error:', error);
      setSetupStatus(`❌ チーム削除に失敗しました: ${error}`);
    }
  };

  // ステータス変更
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
        fetchData();
      } else {
        alert(`ステータス更新に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新中にエラーが発生しました');
    }
  };

  // 編集権限切り替え
  const toggleEditPermission = async (teamId: string, currentStatus: boolean) => {
    if (!confirm(`チーム${teamId}の編集権限を${currentStatus ? '無効' : '有効'}にしますか？`)) {
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

  // 投票完全リセット
  const resetAllVotes = async () => {
    const confirmMessage = `⚠️ 全ての投票データを完全にリセットしますか？\n\n削除される内容:\n・全ての投票履歴\n・全チームの投票数(ハート)\n・全てのコメント\n\nこの操作は取り消せません。`;
    
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
        fetchData();
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

  useEffect(() => {
    fetchData();
    fetchVotingSettings();
    const interval = setInterval(() => {
      fetchData();
      fetchVotingSettings();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalVotes = teams.reduce((sum, team) => sum + team.hearts, 0);

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

        {/* 投票管理パネル */}
        <div className="mb-8">
          <div className={`border rounded-lg p-6 ${
            votingSettings.isVotingOpen 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    votingSettings.isVotingOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <h3 className={`text-xl font-bold ${
                    votingSettings.isVotingOpen ? 'text-green-800' : 'text-red-800'
                  }`}>
                    🗳️ 投票管理
                  </h3>
                </div>
                <p className={`text-sm mb-2 ${
                  votingSettings.isVotingOpen ? 'text-green-700' : 'text-red-700'
                }`}>
                  現在の状態: <span className="font-semibold">
                    {votingSettings.isVotingOpen ? '投票受付中' : '投票締切済み'}
                  </span>
                </p>
                {votingSettings.closedAt && !votingSettings.isVotingOpen && (
                  <p className="text-xs text-red-600">
                    締切日時: {new Date(votingSettings.closedAt).toLocaleString('ja-JP')}
                  </p>
                )}
                {votingSettings.openedAt && votingSettings.isVotingOpen && (
                  <p className="text-xs text-green-600">
                    開始日時: {new Date(votingSettings.openedAt).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
              <button
                onClick={toggleVoting}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  votingSettings.isVotingOpen
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {votingSettings.isVotingOpen ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {loading ? '締切中...' : '投票を締め切る'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15M6 4v16a2 2 0 002 2h8a2 2 0 002-2V4" />
                    </svg>
                    {loading ? '再開中...' : '投票を再開'}
                  </>
                )}
              </button>
            </div>
            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-sm text-gray-600">
                <strong>💡 使い方:</strong> 全チームの発表が終了したら「投票を締め切る」ボタンを押してください。
                投票が締め切られると、参加者は新しい投票ができなくなります。
              </p>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">総投票数</p>
                <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
              </div>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">参加チーム数</p>
                <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
              </div>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">登録ユーザー数</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
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
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {loading ? '処理中...' : '投票を完全リセット'}
              </button>
            </div>
          </div>
        </div>

        {/* チーム管理パネル */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-xl font-bold">チーム管理</h2>
            </div>
            
            <div className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              ↑↓ボタンで順序変更
            </div>
          </div>

          {/* チーム作成 */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => setShowCreateTeam(!showCreateTeam)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新しいチーム作成
            </button>

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

          {/* チーム一覧 */}
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
                    className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {/* 順序変更ボタン */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveTeamUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded ${
                                index === 0 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                              } transition-colors`}
                              title="上に移動"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveTeamDown(index)}
                              disabled={index === teams.length - 1}
                              className={`p-1 rounded ${
                                index === teams.length - 1 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                              } transition-colors`}
                              title="下に移動"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* 順位表示 */}
                          <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-600 shadow-sm border">
                            #{index + 1}
                          </span>
                          
                          <h3 className="text-lg font-bold text-gray-800">{team.title}</h3>
                        </div>
                        <p className="text-purple-600 text-sm mb-1 ml-8">チーム: {team.name}</p>
                        <p className="text-gray-600 text-sm ml-8">
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

                    {/* ステータスバッジ */}
                    <div className="flex items-center gap-2 mb-3 ml-8">
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
                      
                    </div>
                    
                    {/* 投票・コメント統計 */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border mb-3 ml-8">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">投票数</p>
                        <p className="text-lg font-semibold">❤️ {team.hearts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">コメント</p>
                        <p className="text-lg font-semibold">{team.comments.length}</p>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-2 flex-wrap ml-8">
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

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>STEAMDAYS!! - 運営管理システム</p>
          <p>中高生の「好き」と「やりたい」を社会課題解決につなげるプログラム</p>
        </div>
      </div>
    </div>
  );
}