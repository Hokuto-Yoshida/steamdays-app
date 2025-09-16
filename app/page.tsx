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
  sortOrder?: number; // 順序指定フィールドを追加
}

export default function Home() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [currentFeature, setCurrentFeature] = useState(0);

  // 体験できることの機能一覧
  const features = [
    {
      icon: '🎯',
      title: 'プロジェクト体験',
      description: '中高生が4ヶ月間かけて開発したプロジェクトを実際に体験できます',
      gradient: 'linear-gradient(90deg,#60A5FA,#34D399)'
    },
    {
      icon: '🗳️',
      title: '投票システム',
      description: '気に入ったプロジェクトに投票して応援メッセージを届けよう（1人1票）',
      gradient: 'linear-gradient(90deg,#FB7185,#FDBAFA)'
    },
    {
      icon: '💬',
      title: 'ライブチャット',
      description: '参加者全員でリアルタイムに交流・感想を共有できます',
      gradient: 'linear-gradient(90deg,#A78BFA,#60A5FA)'
    },
    {
      icon: '🏆',
      title: 'オーディエンス賞',
      description: '皆さんの投票で最も支持されたプロジェクトが選ばれます',
      gradient: 'linear-gradient(90deg,#FBBF24,#FB923C)'
    }
  ];

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
          let teamsData = result.data;
          
          // 管理画面と同じソート処理を追加
          teamsData.sort((a: Team, b: Team) => {
            const aOrder = a.sortOrder !== undefined ? a.sortOrder : parseInt(a.id) || 999;
            const bOrder = b.sortOrder !== undefined ? b.sortOrder : parseInt(b.id) || 999;
            return aOrder - bOrder;
          });
          
          setTeams(teamsData);
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
        {/* STEAMDAYS!!とは説明セクション */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            STEAMDAYS!!とは
          </h2>
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              次世代を担う中高生がクリエイティブな発想・好奇心を発揮し、デジタルスキルを活用して地域課題・社会課題解決を実践するプログラムです
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://steamdays.innodrops.org/contest-saga2025/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                イベント詳細を見る
              </a>
            </div>
          </div>
        </div>

        {/* 体験できることセクション */}
        <section className="mb-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🌟 体験できること
            </h2>
            <p className="text-lg text-gray-600">
              STEAMDAYS!!の投票システムで楽しめる機能をご紹介
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative p-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 ${
                  currentFeature === index ? 'border-blue-300' : 'border-transparent'
                }`}
                onClick={() => setCurrentFeature(index)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-3 shadow-md"
                  style={{
                    background: feature.gradient,
                    color: 'white'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl shadow-inner p-6">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                style={{
                  background: features[currentFeature].gradient,
                  color: 'white'
                }}
              >
                {features[currentFeature].icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {features[currentFeature].title}
                </h3>
                <p className="text-gray-600">
                  {features[currentFeature].description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {currentFeature === 0 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📱 実際に触れる</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Scratchプロジェクトを直接操作</li>
                      <li>• フルスクリーン表示対応</li>
                      <li>• プロジェクト詳細情報を確認</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🎨 作品を理解</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 解決したい課題を確認</li>
                      <li>• アプローチ方法を理解</li>
                      <li>• チーム情報の詳細表示</li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 1 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🗳️ 投票システム</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 1人1票の公平な投票制度</li>
                      <li>• 感想・コメント必須入力</li>
                      <li>• 重複投票防止システム</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📝 フィードバック</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 具体的な感想を送信</li>
                      <li>• 制作者への励みになる</li>
                      <li>• 応援メッセージが届く</li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 2 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">💬 リアルタイム交流</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 全体チャットで交流</li>
                      <li>• チーム専用チャット</li>
                      <li>• 感想や質問を共有</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🌐 コミュニティ</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 参加者同士で情報交換</li>
                      <li>• ライブ配信のような体験</li>
                      <li>• イベントの一体感を演出</li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 3 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🏆 公正な評価</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 1人1票の投票制度</li>
                      <li>• 透明性のある集計</li>
                      <li>• 参加者の声が反映</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🎉 表彰システム</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 上位チームを表彰</li>
                      <li>• 視覚的な結果表示</li>
                      <li>• みんなで決めるオーディエンス賞</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

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
      </main>

      {/* フッター */}
      <footer className="bg-gray-50 border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>STEAMDAYS!!</p>
          <p className="text-sm mt-2">各チームのプロジェクトを体験して、チャットで交流しよう！</p>
        </div>
      </footer>
    </div>
  );
}