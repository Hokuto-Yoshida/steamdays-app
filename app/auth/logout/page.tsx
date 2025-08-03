'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function LogoutPage() {
  useEffect(() => {
    // ページが読み込まれたら自動的にログアウト
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* ロゴ・タイトル */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            STEAM DAYS!!
          </h1>
          <p className="text-gray-600">ログアウト中...</p>
        </div>

        {/* ログアウト処理中 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ログアウトしています
          </h2>
          <p className="text-gray-600 mb-6">
            ありがとうございました。<br />
            自動的にホームページに移動します...
          </p>
          
          {/* 手動リンク */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              ホームページに戻る
            </Link>
            <Link
              href="/auth/login"
              className="block border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              再ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}