'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// TypeScriptの型定義
interface Team {
  _id: string;
  id: string;
  name: string;
  title: string;
  description: string;
  technologies: string[];
  hearts: number;
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データベースからチーム一覧を取得
  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        const result = await response.json();
        
        if (result.success) {
          setTeams(result.data);
        } else {
          setError('チームデータの取得に失敗しました');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('サーバーエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">チームデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ナビゲーションバー */}
      <Navbar />

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 説明セクション */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            参加チームのプロジェクトを体験しよう！
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            各チームが4ヶ月間かけて開発したプロジェクトを実際に体験できます。
            気に入ったプロジェクトにはハートを押して応援しましょう！
          </p>
        </div>

        {/* チーム数とリアルタイム情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
            <p className="text-gray-600 text-sm">参加チーム</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {teams.reduce((total, team) => total + team.hearts, 0)}
            </div>
            <p className="text-gray-600 text-sm">総ハート数</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">LIVE</div>
            <p className="text-gray-600 text-sm">リアルタイム投票</p>
          </div>
        </div>

        {/* チーム一覧グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border group"
            >
              {/* チーム画像エリア */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-md h-40 mb-4 flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl">
                    {team.name.charAt(4)}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{team.name}</p>
                </div>
              </div>

              {/* チーム情報 */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{team.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {team.description}
              </p>

              {/* 技術タグ */}
              <div className="flex flex-wrap gap-1 mb-4">
                {team.technologies.slice(0, 2).map((tech) => (
                  <span key={tech} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
                {team.technologies.length > 2 && (
                  <span className="text-gray-500 text-xs">+{team.technologies.length - 2}</span>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2">
                <Link href={`/teams/${team.id}`} className="flex-1">
                  <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm">
                    詳細を見る
                  </button>
                </Link>
                <div className="px-4 py-2 border border-red-300 text-red-500 rounded-md bg-red-50 flex items-center gap-1">
                  <span>❤️</span>
                  <span className="font-medium">{team.hearts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* データなしの場合 */}
        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">チームがまだ登録されていません</h3>
          </div>
        )}

        {/* オーディエンス賞セクション */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">🏆 オーディエンス賞</h3>
          <p className="text-gray-600 mb-6">
            皆さんの投票で最も支持されたプロジェクトが選ばれます！<br />
            気に入ったプロジェクトにハートを押して、理由や感想も教えてください。
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
            <p className="text-yellow-800 font-medium">
              💡 各プロジェクトページで実際にアプリを体験できます
            </p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-50 border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>STEAM DAYS 2025 - 精神発達障害と自分らしい個性の生かし方</p>
        </div>
      </footer>
    </div>
  );
}