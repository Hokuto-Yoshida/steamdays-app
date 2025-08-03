'use client';

import { useState, useEffect } from 'react';
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
  const [sortBy, setSortBy] = useState<'hearts' | 'comments'>('hearts');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // データを取得
  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        const result = await response.json();
        
        if (result.success) {
          const sortedTeams = [...result.data].sort((a, b) => {
            if (sortBy === 'hearts') {
              return b.hearts - a.hearts;
            } else {
              return b.comments.length - a.comments.length;
            }
          });
          setTeams(sortedTeams);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
    
    // 30秒ごとに自動更新
    const interval = setInterval(fetchTeams, 30000);
    return () => clearInterval(interval);
  }, [sortBy]);

  // ソート変更時の処理
  useEffect(() => {
    if (teams.length > 0) {
      const sortedTeams = [...teams].sort((a, b) => {
        if (sortBy === 'hearts') {
          return b.hearts - a.hearts;
        } else {
          return b.comments.length - a.comments.length;
        }
      });
      setTeams(sortedTeams);
    }
  }, [sortBy]);

  const getTotalVotes = () => {
    return teams.reduce((total, team) => total + team.hearts, 0);
  };

  const getTotalComments = () => {
    return teams.reduce((total, team) => total + team.comments.length, 0);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ナビゲーションバー */}
      <Navbar 
        title="🏆 オーディエンス賞ランキング"
        showBackButton={true}
        backUrl="/"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{teams.length}</div>
            <p className="text-gray-600">参加チーム</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{getTotalVotes()}</div>
            <p className="text-gray-600">総投票数</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{getTotalComments()}</div>
            <p className="text-gray-600">総コメント数</p>
          </div>
        </div>

        {/* ソート切り替え */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">並び替え:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('hearts')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  sortBy === 'hearts'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❤️ ハート数順
              </button>
              <button
                onClick={() => setSortBy('comments')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  sortBy === 'comments'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💬 コメント数順
              </button>
            </div>
          </div>
        </div>

        {/* ランキングリスト */}
        <div className="space-y-4">
          {teams.map((team, index) => {
            const rank = index + 1;
            const percentage = sortBy === 'hearts' 
              ? Math.round((team.hearts / getTotalVotes()) * 100) || 0
              : Math.round((team.comments.length / getTotalComments()) * 100) || 0;

            return (
              <div
                key={team.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  rank === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white' :
                  rank === 2 ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-white' :
                  rank === 3 ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-white' :
                  'border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* ランク表示 */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-lg`}>
                      {rank <= 3 ? getRankIcon(rank) : rank}
                    </div>

                    {/* チーム情報 */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {team.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{team.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {team.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 得票数表示 */}
                  <div className="text-right">
                    <div className="flex items-center gap-6 mb-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {team.hearts}
                        </div>
                        <p className="text-xs text-gray-500">ハート</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {team.comments.length}
                        </div>
                        <p className="text-xs text-gray-500">コメント</p>
                      </div>
                    </div>
                    
                    {/* プログレスバー */}
                    <div className="w-32 bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`bg-gradient-to-r ${getRankColor(rank)} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>

                  {/* アクションボタン */}
                  <div className="ml-6">
                    <Link
                      href={`/teams/${team.id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>

                {/* 最新コメント（上位3位まで表示） */}
                {rank <= 3 && team.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">💬 最新のコメント</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 italic">
                        "{team.comments[team.comments.length - 1].reason}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(team.comments[team.comments.length - 1].timestamp).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 投票を促すCTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🗳️ まだ投票していませんか？</h3>
          <p className="mb-6 text-blue-100">
            気に入ったプロジェクトにハートを送って、オーディエンス賞の選考に参加しましょう！
          </p>
          <Link
            href="/"
            className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            プロジェクト一覧を見る
          </Link>
        </div>
      </main>
    </div>
  );
}