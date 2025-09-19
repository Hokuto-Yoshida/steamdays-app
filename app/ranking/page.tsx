'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// TypeScript型定義
interface Team {
  _id: string;
  id: string;
  name: string;
  title: string;
  technologies: string[];
  hearts: number;
  comments: Array<{ reason: string; timestamp: string; author: string; }>;
}

interface VotingSettings {
  isVotingOpen: boolean;
  closedAt?: Date;
  openedAt?: Date;
}

export default function Ranking() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [votingSettings, setVotingSettings] = useState<VotingSettings>({
    isVotingOpen: true
  });

  // 投票設定取得関数
  const fetchVotingSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/voting-settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVotingSettings(result.data);
        }
      }
    } catch (error) {
      console.error('投票設定取得エラー:', error);
    }
  }, []);

  // データを取得する関数をuseCallbackでメモ化
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/teams');
      const result = await response.json();
      
      if (result.success) {
        // 投票数順で並び替え
        const sortedTeams = [...result.data].sort((a, b) => b.hearts - a.hearts);
        setTeams(sortedTeams);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期データ取得と定期更新
  useEffect(() => {
    fetchTeams();
    fetchVotingSettings();
    
    // 30秒ごとに自動更新
    const interval = setInterval(() => {
      fetchTeams();
      fetchVotingSettings();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTeams, fetchVotingSettings]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}位`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-400 to-gray-600';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Navbar 
          title="🏆 オーディエンス賞ランキング"
          showBackButton={true}
          backUrl="/"
        />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">ランキングを読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ナビゲーションバー */}
      <Navbar 
        title="🏆 オーディエンス賞ランキング"
        showBackButton={true}
        backUrl="/"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 投票状態表示 */}
        <div className={`rounded-lg shadow-md p-6 mb-6 border-l-4 ${
          votingSettings.isVotingOpen 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                votingSettings.isVotingOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <h3 className={`text-lg font-semibold ${
                votingSettings.isVotingOpen ? 'text-green-800' : 'text-red-800'
              }`}>
                {votingSettings.isVotingOpen ? '🗳️ 投票受付中' : '🔒 投票終了'}
              </h3>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                votingSettings.isVotingOpen ? 'text-green-700' : 'text-red-700'
              }`}>
                {votingSettings.isVotingOpen ? '投票はまだ受け付けています' : '投票受付は終了しました'}
              </p>
              {votingSettings.closedAt && !votingSettings.isVotingOpen && (
                <p className="text-xs text-red-600 mt-1">
                  終了: {new Date(votingSettings.closedAt).toLocaleString('ja-JP')}
                </p>
              )}
              {votingSettings.openedAt && votingSettings.isVotingOpen && (
                <p className="text-xs text-green-600 mt-1">
                  開始: {new Date(votingSettings.openedAt).toLocaleString('ja-JP')}
                </p>
              )}
            </div>
          </div>
          <div className={`mt-4 p-3 rounded border ${
            votingSettings.isVotingOpen 
              ? 'bg-green-100 border-green-200' 
              : 'bg-red-100 border-red-200'
          }`}>
            <p className={`text-sm ${
              votingSettings.isVotingOpen ? 'text-green-700' : 'text-red-700'
            }`}>
              {votingSettings.isVotingOpen 
                ? '💡 各プロジェクトの詳細ページから投票できます。投票は1人1回までです。'
                : '🏆 最終結果が表示されています。ご参加いただきありがとうございました！'
              }
            </p>
          </div>
        </div>

        {/* 最終更新時刻とソート情報 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              投票数順で表示
            </div>
          </div>
          {!votingSettings.isVotingOpen && teams.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">最終結果確定</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                この結果が STEAM DAYS オーディエンス賞の最終順位です
              </p>
            </div>
          )}
        </div>

        {/* ランキングリスト */}
        <div className="space-y-4">
          {teams.map((team, index) => {
            const rank = index + 1;

            return (
              <div
                key={team.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all duration-300 hover:shadow-lg ${
                  rank === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white' :
                  rank === 2 ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-white' :
                  rank === 3 ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-white' :
                  'border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* ランク表示 */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-lg shadow-lg relative`}>
                      {rank <= 3 ? getRankIcon(rank) : rank}
                      {/* 投票終了時の王冠アイコン（1位のみ） */}
                      {!votingSettings.isVotingOpen && rank === 1 && (
                        <div className="absolute -top-2 -right-1">
                          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs animate-pulse">
                            👑
                          </div>
                        </div>
                      )}
                    </div>

                    {/* チーム情報 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {team.name}
                        </h3>
                        {/* 投票終了時の順位バッジ */}
                        {!votingSettings.isVotingOpen && rank <= 3 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                            rank === 1 ? 'bg-yellow-500' :
                            rank === 2 ? 'bg-gray-500' :
                            'bg-orange-500'
                          }`}>
                            {rank === 1 ? '🥇 優勝' : rank === 2 ? '🥈 2位' : '🥉 3位'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{team.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {team.technologies.slice(0, 4).map((tech, index) => (
                          <span 
                            key={tech} 
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              index === 0 ? 'bg-blue-100 text-blue-700' :
                              index === 1 ? 'bg-green-100 text-green-700' :
                              index === 2 ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                        {team.technologies.length > 4 && (
                          <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">
                            +{team.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 投票数表示 */}
                  <div className="text-center mr-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <div className="text-3xl font-bold text-red-500">
                        {team.hearts}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {votingSettings.isVotingOpen ? '現在の投票数' : '最終投票数'}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div>
                    <Link
                      href={`/teams/${team.id}`}
                      className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span>{votingSettings.isVotingOpen ? '詳細・投票' : '詳細を見る'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* データなしの場合 */}
        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ投票が開始されていません</h3>
            <p className="text-gray-600">投票が開始されるとランキングが表示されます</p>
          </div>
        )}

        {/* 投票終了時の追加情報 */}
        {!votingSettings.isVotingOpen && teams.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🎉 STEAM DAYS 2025 結果発表
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl mb-2">🥇</div>
                <h4 className="font-semibold text-yellow-800">オーディエンス賞</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {teams[0]?.name || '該当なし'}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {teams[0]?.hearts || 0}票獲得
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xl mb-2">📊</div>
                <h4 className="font-semibold text-gray-700">総投票数</h4>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {teams.reduce((sum, team) => sum + team.hearts, 0)}票
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xl mb-2">👥</div>
                <h4 className="font-semibold text-blue-700">参加チーム数</h4>
                <p className="text-lg font-bold text-blue-800 mt-1">
                  {teams.length}チーム
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <p className="text-sm text-gray-700 text-center">
                すべての参加者の皆様、お疲れさまでした！<br />
                素晴らしいプロジェクトをありがとうございました。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}