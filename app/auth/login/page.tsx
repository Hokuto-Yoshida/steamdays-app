'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 ログイン試行:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      console.log('📡 ログイン結果:', result);

      if (result?.error) {
        console.error('❌ ログインエラー:', result.error);
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (result?.ok) {
        console.log('✅ ログイン成功');
        // ログイン成功後、セッション情報を取得してリダイレクト
        const session = await getSession();
        console.log('👤 セッション情報:', session);
        
        if (session?.user?.role === 'admin') {
          router.push('/admin');
        } else if (session?.user?.role === 'presenter') {
          router.push(`/teams/${session.user.teamId}`);
        } else {
          router.push('/');
        }
      } else {
        console.error('❌ 不明なログインエラー');
        setError('ログインに失敗しました');
      }
    } catch (error) {
      console.error('❌ ログイン処理エラー:', error);
      setError('ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            STEAM DAYS!!
          </h1>
          <p className="text-gray-600">ログインしてアクセス</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            ログイン
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {loading ? '⏳ ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* デモアカウント情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">デモアカウント</h3>
            <div className="space-y-2 text-xs">
              <div className="bg-yellow-50 p-2 rounded border">
                <strong>🔧 運営:</strong> admin@steamdays.com / password123
              </div>
            </div>
          </div>
        </div>

        {/* 新規登録リンク */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/auth/register" className="text-blue-500 hover:text-blue-600">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}