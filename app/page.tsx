'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LiveChat from '@/components/LiveChat';
import LandingPage from '@/components/LandingPage';

// TypeScriptの型定義
interface Team {
  _id: string;
  id: string;
  name: string;
  title: string;
  description: string;
  technologies: string[];
  hearts: number;
  imageUrl?: string;
  status?: 'upcoming' | 'live' | 'ended';
  comments?: { reason: string; timestamp: string; author: string }[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // 画像読み込みエラーを記録
  const handleImageError = (teamId: string) => {
    setImageErrors(prev => new Set(prev).add(teamId));
  };

  // ステータス表示用の関数
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'live':
        return {
          label: 'ピッチ中',
          color: 'bg-red-500 text-white',
          pulseColor: 'bg-red-500',
          icon: '🔴',
          showPulse: true
        };
      case 'ended':
        return {
          label: '終了',
          color: 'bg-gray-500 text-white',
          pulseColor: 'bg-gray-500',
          icon: '⏹️',
          showPulse: false
        };
      case 'upcoming':
      default:
        return {
          label: '開始前',
          color: 'bg-blue-500 text-white',
          pulseColor: 'bg-blue-500',
          icon: '⏰',
          showPulse: false
        };
    }
  };

  // データベースからチーム一覧を取得（ログイン済みの場合のみ）
  useEffect(() => {
    if (status === 'loading' || !session) {
      return; // ログインしていない場合は何もしない
    }

    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        const result = await response.json();
        
        if (result.success) {
          setTeams(result.data);
          setImageErrors(new Set());
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
  }, [session, status]); // sessionとstatusを依存配列に追加

  // ログイン状態の読み込み中はローディング表示
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログインしていない場合はランディングページを表示
  if (!session) {
    return <LandingPage />;
  }

  // データ読み込み中
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

  // エラー表示
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

  // メインアプリの表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ナビゲーションバー */}
      <Navbar />

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 説明セクション */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            参加チームのプロジェクトを体験しよう！
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            各チームが4ヶ月間かけて開発したプロジェクトを実際に体験できます。
            気に入ったプロジェクトにはハートを押して応援しましょう！
          </p>
        </div>

        {/* ライブ中のチーム専用セクション */}
        {teams.some(team => team.status === 'live') && (
          <div className="mb-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
              </div>
              <h3 className="text-xl font-bold">🔴 現在ピッチ中のチーム</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams
                .filter(team => team.status === 'live')
                .map(team => (
                  <div key={team.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <h4 className="font-semibold text-lg mb-1">{team.name}</h4>
                    <p className="text-white/90 text-sm mb-2">{team.title}</p>
                    <Link href={`/teams/${team.id}`} className="inline-flex items-center gap-2 bg-white text-red-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-50 transition-colors">
                      <span>詳細を見る</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ライブチャット */}
        <div className="mb-8">
          <LiveChat />
        </div>

        {/* チーム一覧グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const statusConfig = getStatusConfig(team.status);
            
            return (
              <div
                key={team._id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border group transform hover:-translate-y-1"
              >
                {/* チーム画像エリア */}
                <div className="relative h-48 overflow-hidden">
                  {team.imageUrl && !imageErrors.has(team.id) ? (
                    <>
                      <img
                        src={team.imageUrl}
                        alt={`${team.name} のカバー画像`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={() => handleImageError(team.id)}
                      />
                      {/* グラデーションオーバーレイ */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    </>
                  ) : (
                    // 画像がない場合のデフォルト表示
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300"></div>
                  )}
                  
                  {/* チーム名バッジ */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                      {team.name}
                    </span>
                  </div>

                  {/* ステータスバッジ */}
                  <div className="absolute top-3 right-3">
                    <div className={`${statusConfig.color} px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium shadow-sm backdrop-blur-sm`}>
                      <span className="relative flex items-center">
                        {statusConfig.showPulse && (
                          <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${statusConfig.pulseColor} opacity-75`}></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.pulseColor}`}></span>
                      </span>
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* ハート数バッジ */}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-red-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm font-medium shadow-sm">
                      <span>❤️</span>
                      <span>{team.hearts}</span>
                    </div>
                  </div>

                  {/* チーム画像の中央アイコン（画像がない場合） */}
                  {(!team.imageUrl || imageErrors.has(team.id)) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                          {team.name.charAt(4) || '🎯'}
                        </div>
                        <p className="text-sm font-medium drop-shadow">{team.name}</p>
                      </div>
                    </div>
                  )}

                  {/* ライブ中の特別エフェクト */}
                  {team.status === 'live' && (
                    <div className="absolute inset-0 border-2 border-red-500 rounded-lg animate-pulse"></div>
                  )}
                </div>

                {/* カード内容 */}
                <div className="p-6">
                  {/* プロジェクトタイトル */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                    {team.title}
                  </h3>
                  
                  {/* プロジェクト説明 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {team.description}
                  </p>

                  {/* 技術タグ */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {team.technologies.slice(0, 3).map((tech, index) => (
                      <span 
                        key={tech} 
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          index === 0 ? 'bg-blue-100 text-blue-700' :
                          index === 1 ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                    {team.technologies.length > 3 && (
                      <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">
                        +{team.technologies.length - 3}
                      </span>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}`} className="flex-1">
                      <button className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 group">
                        <span>詳細を見る</span>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">チームがまだ登録されていません</h3>
            <p className="text-gray-600">管理者がチームを作成するとここに表示されます</p>
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
            <p className="text-yellow-800 font-medium flex items-center gap-2 justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              各プロジェクトページで実際にアプリを体験できます
            </p>
          </div>
        </div>

        {/* チャット利用ガイド */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            全体チャットをご活用ください
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-500">💬</span>
              <div>
                <p className="font-medium">リアルタイム交流</p>
                <p className="text-blue-600">他の参加者とリアルタイムでやり取りできます</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">🤝</span>
              <div>
                <p className="font-medium">感想や質問を共有</p>
                <p className="text-blue-600">プロジェクトについての感想や質問を気軽に投稿しましょう</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-50 border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>STEAM DAYS 2025 - 精神発達障害と自分らしい個性の生かし方</p>
          <p className="text-sm mt-2">各チームのプロジェクトを体験して、チャットで交流しよう！</p>
        </div>
      </footer>
    </div>
  );
}