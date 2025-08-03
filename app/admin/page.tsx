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
  totalComments: number;
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

  // 統計データの取得
  const fetchStats = async () => {
    setRefreshing(true);
    try {
      // チームデータ取得
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json();
        if (teamsResult.success && teamsResult.data) {
          const teamsData: TeamStats[] = teamsResult.data;
          setTeams(teamsData);
          
          const totalVotes = teamsData.reduce((sum: number, team: TeamStats) => sum + team.hearts, 0);
          const totalComments = teamsData.reduce((sum: number, team: TeamStats) => sum + (team.comments?.length || 0), 0);
          
          // topTeamの安全な取得
          let topTeam: { name: string; hearts: number } | null = null;
          if (teamsData.length > 0) {
            const maxHeartsTeam = teamsData.reduce((prev: TeamStats, current: TeamStats) => 
              (prev.hearts > current.hearts) ? prev : current
            );
            topTeam = { name: maxHeartsTeam.name, hearts: maxHeartsTeam.hearts };
          }

          // ユーザーデータを先に取得してからstatsを設定
          const usersResponse = await fetch('/api/debug-users');
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
            totalComments: totalComments,
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

  useEffect(() => {
    fetchStats();
    // 30秒ごとに自動更新
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTeamStatusChange = async (teamId: string, newStatus: string) => {
    // 将来の機能として実装予定
    alert(`チーム${teamId}のステータスを${newStatus}に変更する機能は開発予定です`);
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
        title="🔧 STEAM DAYS 運営管理"
        showBackButton={true}
        backUrl="/"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">STEAM DAYS 運営ダッシュボード</h1>
              <p className="text-gray-600">最終コンテスト投票システム管理</p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? '更新中...' : '最新情報に更新'}
          </button>
        </div>

        {/* ステータス表示 */}
        {setupStatus && (
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-400">
            <p className="font-medium">{setupStatus}</p>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600 mb-1">総コメント数</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalComments || 0}</p>
            </div>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* チーム管理パネル */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-xl font-bold">チーム管理</h2>
            </div>
            <div className="p-6">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-lg mb-2">チームの登録をお待ちしています</p>
                  <p className="text-sm">発表者が登録すると、こちらに表示されます</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams
                    .sort((a, b) => b.hearts - a.hearts)
                    .map((team, index) => (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {index === 0 && <span className="text-yellow-500">🏆</span>}
                            {index === 1 && <span className="text-gray-400">🥈</span>}
                            {index === 2 && <span className="text-orange-400">🥉</span>}
                            <h3 className="text-lg font-bold">{team.title}</h3>
                          </div>
                          <p className="text-purple-600 text-sm mb-1">チーム: {team.name}</p>
                          <p className="text-gray-600 text-sm">
                            メンバー: {team.members.join(', ') || '未設定'}
                          </p>
                        </div>
                        <div className="ml-4">
                          <select
                            value={team.status || 'upcoming'}
                            onChange={(e) => handleTeamStatusChange(team.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="upcoming">開始前</option>
                            <option value="live">ピッチ中</option>
                            <option value="ended">終了</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border mb-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">ハート数</p>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ユーザー管理 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h2 className="text-xl font-bold">ユーザー管理</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.teamId && (
                          <div className="text-sm text-purple-600">チーム {user.teamId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'アクティブ' : '無効'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-lg mb-2">ユーザーの登録をお待ちしています</p>
                  <p className="text-sm">参加者が登録すると、こちらに表示されます</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>STEAM DAYS 2025 - 運営管理システム</p>
          <p>中高生の「好き」と「やりたい」を社会課題解決につなげるプログラム</p>
        </div>
      </div>
    </div>
  );
}