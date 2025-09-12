'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Navbar({ title = 'STEAMDAYS!!', showBackButton = false, backUrl = '/' }: NavbarProps) {
  const { data: session, status } = useSession();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '🔧 管理者';
      case 'presenter': return '👥 発表者';
      case 'voter': return '🗳️ 投票者';
      default: return '';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'presenter': return 'bg-green-100 text-green-800';
      case 'voter': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 左側：ロゴとタイトル */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/steamdays-logo.png" 
                alt="STEAMDAYS ロゴ" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // 画像が読み込めない場合のフォールバック
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* フォールバック用アイコン */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{display: 'none'}}>
                S
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
          </div>

          {/* 右側：ユーザー情報とメニュー */}
          <div className="flex items-center gap-4">
            {/* 主要ナビゲーション */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ホーム
              </Link>
              
              {/* イベントサイトリンク */}
              <a
                href="https://steamdays.innodrops.org/contest-saga2025/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                イベントサイト
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              {/* ランキングは管理者のみ表示 */}
              {session?.user?.role === 'admin' && (
                <Link
                  href="/ranking"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ランキング
                </Link>
              )}
              
              {/* ロール別リンク */}
              {session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-red-600 hover:text-red-800 transition-colors font-medium"
                >
                  管理
                </Link>
              )}
              
              {session?.user?.role === 'presenter' && session?.user?.teamId && (
                <Link
                  href={`/teams/${session.user.teamId}/edit`}
                  className="text-green-600 hover:text-green-800 transition-colors font-medium"
                >
                  チーム編集
                </Link>
              )}
            </nav>

            {/* ユーザー情報 */}
            {status === 'loading' ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : session ? (
              <div className="flex items-center gap-3">
                {/* ロールバッジ */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(session.user.role)}`}>
                  {getRoleDisplayName(session.user.role)}
                </span>
                
                {/* ユーザー名 */}
                <span className="text-gray-700 font-medium">
                  {session.user.name}
                </span>
                
                {/* ログアウトボタン */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  登録
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* モバイル用ナビゲーション */}
        <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">ホーム</Link>
            <a 
              href="https://steamdays.innodrops.org/contest-saga2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              イベントサイト
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            {/* モバイルでもランキングは管理者のみ */}
            {session?.user?.role === 'admin' && (
              <Link href="/ranking" className="text-gray-600 hover:text-gray-800">ランキング</Link>
            )}
            
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className="text-red-600 hover:text-red-800 font-medium">管理</Link>
            )}
            {session?.user?.role === 'presenter' && session?.user?.teamId && (
              <Link href={`/teams/${session.user.teamId}/edit`} className="text-green-600 hover:text-green-800 font-medium">チーム編集</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}