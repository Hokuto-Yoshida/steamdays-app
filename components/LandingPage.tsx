// components/LandingPage.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);

  // ロゴのカラーパレットに合わせたグラデーションを inline style で指定
  const features = [
    {
      icon: '🎯',
      title: 'プロジェクト体験',
      description: '中高生が4ヶ月間かけて開発したプロジェクトを実際に体験できます',
      gradient: 'linear-gradient(90deg,#60A5FA,#34D399)' // blue -> green
    },
    {
      icon: '💖',
      title: 'リアルタイム投票',
      description: '気に入ったプロジェクトにハートを送って応援メッセージを届けよう',
      gradient: 'linear-gradient(90deg,#FB7185,#FDBAFA)' // pink-ish
    },
    {
      icon: '💬',
      title: 'ライブチャット',
      description: '参加者全員でリアルタイムに交流・感想を共有できます',
      gradient: 'linear-gradient(90deg,#A78BFA,#60A5FA)' // purple -> blue
    },
    {
      icon: '🏆',
      title: 'オーディエンス賞',
      description: '皆さんの投票で最も支持されたプロジェクトが選ばれます',
      gradient: 'linear-gradient(90deg,#FBBF24,#FB923C)' // yellow -> orange
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white text-gray-900">
      {/* ヒーロー */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            {/* ロゴ・タイトル */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">

                {/* カラフルなリングのプレート - 輪郭（薄いシャドウ） */}
                <div
                  aria-hidden
                  className="absolute rounded-full"
                  style={{
                    width: 250,
                    height: 250,
                    zIndex: 1,
                    background: 'transparent',
                  }}
                />

                {/* 白プレート（ロゴ本体） */}
                <div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: 220,
                    height: 220,
                    background: '#ffffff',
                    zIndex: 2,
                    border: '6px solid rgba(255,255,255,0.9)'
                  }}
                >
                  <Image
                    src="/images/steamdays-logo.png"
                    alt="STEAM DAYS ロゴ"
                    width={180}
                    height={180}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* キャプション */}
              <p className="text-base sm:text-lg text-gray-700 font-medium mt-2">
                最終コンテスト 投票システム
              </p>
            </div>

            {/* サブタイトル */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                精神発達障害と自分らしい個性の生かし方
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                中高生が4ヶ月間かけて取り組んだプロジェクトを体験し、
                <br className="hidden sm:inline" />
                気に入った作品に投票してオーディエンス賞を決めよう！
              </p>
            </div>

            {/* CTAボタン（ロゴの多色を使ったグラデ） */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth/login"
                className="text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background:
                    'linear-gradient(90deg,#60A5FA 0%, #A78BFA 35%, #FB7185 65%, #FBBF24 100%)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                ログインして参加
              </Link>

              <Link
                href="/auth/register"
                className="px-8 py-4 rounded-full font-semibold text-lg hover:bg-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  border: '2px solid rgba(167,139,250,0.9)',
                  color: '#7C3AED',
                  background: 'white'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              🌟 体験できること
            </h2>
            <p className="text-lg text-gray-600">
              STEAMDAYS!!の投票システムで楽しめる機能をご紹介
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer`}
                onClick={() => setCurrentFeature(index)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg"
                  style={{
                    background: feature.gradient,
                    color: 'white'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                style={{
                  background: features[currentFeature].gradient,
                  color: 'white'
                }}
              >
                {features[currentFeature].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {features[currentFeature].title}
                </h3>
                <p className="text-gray-600">
                  {features[currentFeature].description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentFeature === 0 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">📱 実際に触れる</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        Scratchプロジェクトを直接操作
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        フルスクリーン表示対応
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        プロジェクト詳細情報を確認
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">🎨 作品を理解</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                        解決したい課題を確認
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                        アプローチ方法を理解
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                        使用技術を知る
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 1 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">💖 応援システム</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        ハートを送って応援
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        感想・コメント必須
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        重複投票防止システム
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">📝 フィードバック</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                        具体的な感想を送信
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                        制作者への励みに
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                        応援メッセージ一覧
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 2 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">💬 リアルタイム交流</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        全体チャットで交流
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        感想や質問を共有
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        2秒間隔で自動更新
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">🌐 コミュニティ</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        参加者同士で情報交換
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        ライブ配信のような体験
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        イベントの一体感を演出
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {currentFeature === 3 && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">🏆 公正な評価</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        リアルタイムランキング
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        ハート数で自動集計
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        30秒ごとに更新
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">🎉 表彰システム</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        1位〜3位まで表彰
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        視覚的なランキング表示
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        参加者の声が反映
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16" style={{ background: 'linear-gradient(90deg,#60A5FA 0%, #A78BFA 40%, #FB7185 70%, #FBBF24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              🎯 今すぐ参加しよう！
            </h2>
            <p className="text-xl text-white/90 mb-8">
              中高生の創造性と技術力を体験し、<br className="hidden sm:inline" />
              オーディエンス賞の選考に参加してみませんか？
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                新規登録して始める
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                既存アカウントでログイン
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">STEAMDAYS!! 2025</h3>
            <p className="text-gray-400 mb-4">精神発達障害と自分らしい個性の生かし方</p>

            {/* フッターのアクセントラインを多色グラデに */}
            <div className="w-20 h-1 mx-auto mb-4" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA,#FB7185,#FBBF24)' }} />

            <p className="text-sm text-gray-500">
              中高生の「好き」と「やりたい」を社会課題解決につなげるプログラム
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}