'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
}

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const router = useRouter();

  // チーム一覧を取得
  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await fetch('/api/teams/list');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeams(result.data || []);
        }
      }
    } catch (error) {
      console.error('Teams fetch error:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  // 発表者が選択されたときにチーム一覧を取得
  useEffect(() => {
    if (formData.role === 'presenter') {
      fetchTeams();
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📝 登録データ送信:', { ...formData, password: '***' });
      
      // 1. 新規登録
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
          // 🆕 2. 自動ログイン
          setSuccess('✅ アカウント作成完了！自動ログイン中...');
          console.log('🔐 自動ログイン開始...');
          
          const loginResult = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false, // リダイレクトを無効にして手動制御
          });

          console.log('🔐 ログイン結果:', loginResult);

          if (loginResult?.error) {
            // ログインに失敗した場合は手動ログインを促す
            console.error('❌ 自動ログイン失敗:', loginResult.error);
            setError('✅ アカウント作成は完了しましたが、自動ログインに失敗しました。手動でログインしてください。');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
            return;
          }

          // 🎉 3. 成功時のメッセージとリダイレクト
          setSuccess('🎉 登録＆ログイン完了！メインページに移動します...');
          console.log('🎉 自動ログイン成功！メインページに移動...');
          
          setTimeout(() => {
            router.push('/');
          }, 1500);
          
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
      [name]: value,
      // ロールが変更されたらチームIDをリセット
      ...(name === 'role' && value !== 'presenter' ? { teamId: '' } : {})
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
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="voter">🗳️ 投票者（観客）</option>
                <option value="presenter">👥 発表者（チームメンバー）</option>
              </select>
            </div>

            {formData.role === 'presenter' && (
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
                  チーム選択 *
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  required
                  disabled={teamsLoading || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {teamsLoading ? 'チーム読み込み中...' : 'チームを選択してください'}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                
                {!teamsLoading && teams.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-sm">
                      ⚠️ まだチームが作成されていません。管理者にお問い合わせください。
                    </p>
                  </div>
                )}

                {teams.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={fetchTeams}
                      disabled={teamsLoading || loading}
                      className="text-blue-500 hover:text-blue-600 text-sm disabled:text-gray-400"
                    >
                      {teamsLoading ? '更新中...' : '🔄 チーム一覧を更新'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (formData.role === 'presenter' && teamsLoading)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {loading ? '⏳ 処理中...' : 'アカウント作成 & ログイン'}
            </button>
          </form>

          {/* 🆕 UX改善の説明 */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm text-center">
              💡 登録後は自動でログインしてメインページに移動します
            </p>
          </div>

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
            <div className="mt-2 text-xs text-gray-500">
              <p>※ 管理者アカウントは運営によって別途作成されます</p>
              <p>※ チームが表示されない場合は、管理者がまだチームを作成していない可能性があります</p>
            </div>
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
      </div>
    </div>
  );
}