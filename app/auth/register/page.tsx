'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'voter',
    teamId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📝 登録データ送信:', { ...formData, password: '***' });
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('📡 レスポンス状態:', response.status);
      
      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);

      if (!response.ok) {
        // エラーレスポンスの場合
        let errorMessage = `HTTP Error: ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } else {
          // HTMLエラーページなどの場合
          const errorText = await response.text();
          console.error('❌ 非JSON エラーレスポンス:', errorText.substring(0, 200));
          errorMessage = 'サーバーエラーが発生しました。詳細はコンソールをご確認ください。';
        }
        
        setError(errorMessage);
        return;
      }

      // 成功レスポンスの処理
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('✅ 登録成功:', result);
        
        if (result.success) {
          setSuccess('アカウントが正常に作成されました！ログインページに移動します...');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          setError(result.error || 'アカウント作成に失敗しました');
        }
      } else {
        console.error('❌ 成功レスポンスが JSON ではありません');
        setError('サーバーから無効なレスポンスが返されました');
      }

    } catch (error) {
      console.error('❌ 登録エラー:', error);
      setError('ネットワークエラーまたはサーバーエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            STEAM DAYS!!
          </h1>
          <p className="text-gray-600">新規アカウント作成</p>
        </div>

        {/* 登録フォーム */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            新規登録
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                お名前 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="田中 太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6文字以上"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                役割 *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="voter">🗳️ 投票者（観客）</option>
                <option value="presenter">👥 発表者（チームメンバー）</option>
              </select>
            </div>

            {formData.role === 'presenter' && (
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
                  チームID *
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">チームを選択してください</option>
                  <option value="1">チーム 1 - コネクト</option>
                  <option value="2">チーム 2 - ハーモニー</option>
                  <option value="3">チーム 3 - エンパワー</option>
                  <option value="4">チーム 4 - サポート</option>
                  <option value="5">チーム 5 - クリエイト</option>
                  <option value="6">チーム 6 - ブリッジ</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {loading ? '⏳ 登録中...' : 'アカウント作成'}
            </button>
          </form>

          {/* 役割の説明 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">役割について</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="bg-blue-50 p-2 rounded border">
                <strong>🗳️ 投票者:</strong> プロジェクトの閲覧と投票ができます
              </div>
              <div className="bg-green-50 p-2 rounded border">
                <strong>👥 発表者:</strong> 自分のチームのプロジェクト編集と投票ができます
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 管理者アカウントは運営によって別途作成されます
            </p>
          </div>

          {/* ログインリンク */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              既にアカウントをお持ちですか？{' '}
              <Link href="/auth/login" className="text-blue-500 hover:text-blue-600">
                ログイン
              </Link>
            </p>
          </div>
        </div>

        {/* ゲストアクセス */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← ゲストとして閲覧する
          </Link>
        </div>
      </div>
    </div>
  );
}