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

export default function Ranking() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // データを取得する関数をuseCallbackでメモ化
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/teams');
      const result = await response.json();
      
      if (result.success) {
        // ハート数順で並び替え
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
    
    // 30秒ごとに自動更新
    const interval = setInterval(fetchTeams, 30000);
    return () => clearInterval(interval);
  }, [fetchTeams]);

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
        {/* 最終更新時刻とソート情報 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
            </div>
          </div>
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
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {rank <= 3 ? getRankIcon(rank) : rank}
                    </div>

                    {/* チーム情報 */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {team.name}
                      </h3>
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

                  {/* ハート数表示 */}
                  <div className="text-center mr-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <div className="text-3xl font-bold text-red-500">
                        {team.hearts}
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div>
                    <Link
                      href={`/teams/${team.id}`}
                      className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span>詳細を見る</span>
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
      </main>
    </div>
  );
}