'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Navbar({ title = 'STEAM DAYS!!', showBackButton = false, backUrl = '/' }: NavbarProps) {
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
          {/* 左側：タイトルとナビゲーション */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link 
                href={backUrl}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← 戻る
              </Link>
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
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
              <Link
                href="/ranking"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ランキング
              </Link>
              
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
            <Link href="/ranking" className="text-gray-600 hover:text-gray-800">ランキング</Link>
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