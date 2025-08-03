'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Team {
  id: string;
  name: string;
  title: string;
  description: string;
  challenge: string;
  approach: string;
  members: string[];
  technologies: string[];
  scratchUrl: string;
}

export default function TeamEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [technologyInput, setTechnologyInput] = useState('');

  // 権限チェック
  const canEdit = () => {
    if (!session?.user) return false;
    return session.user.role === 'admin' || 
           (session.user.role === 'presenter' && session.user.teamId === params.id);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (!canEdit()) {
      router.push('/');
      return;
    }

    fetchTeam();
  }, [session, status, params.id]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`);
      if (!response.ok) throw new Error('チーム情報の取得に失敗しました');
      
      const result = await response.json();
      if (result.success) {
        setTeam(result.data);
      } else {
        throw new Error(result.error || 'チーム情報の取得に失敗しました');
      }
    } catch (err) {
      setError('チーム情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !canEdit()) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(team),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || '保存に失敗しました');
      }

      router.push(`/teams/${params.id}`);
    } catch (err) {
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const addMember = () => {
    if (memberInput.trim() && team) {
      setTeam({
        ...team,
        members: [...team.members, memberInput.trim()]
      });
      setMemberInput('');
    }
  };

  const removeMember = (index: number) => {
    if (team) {
      setTeam({
        ...team,
        members: team.members.filter((_, i) => i !== index)
      });
    }
  };

  const addTechnology = () => {
    if (technologyInput.trim() && team) {
      setTeam({
        ...team,
        technologies: [...team.technologies, technologyInput.trim()]
      });
      setTechnologyInput('');
    }
  };

  const removeTechnology = (index: number) => {
    if (team) {
      setTeam({
        ...team,
        technologies: team.technologies.filter((_, i) => i !== index)
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">チームが見つかりません</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            チーム編集: {team.name}
          </h1>
          <p className="text-gray-600">プロジェクト情報を編集できます</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チーム名
                </label>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => setTeam({ ...team, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクトタイトル
                </label>
                <input
                  type="text"
                  value={team.title}
                  onChange={(e) => setTeam({ ...team, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scratch プロジェクト URL
              </label>
              <input
                type="url"
                value={team.scratchUrl}
                onChange={(e) => setTeam({ ...team, scratchUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://scratch.mit.edu/projects/..."
              />
            </div>
          </div>

          {/* プロジェクト詳細 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">プロジェクト詳細</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト説明
                </label>
                <textarea
                  value={team.description}
                  onChange={(e) => setTeam({ ...team, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解決したい課題
                </label>
                <textarea
                  value={team.challenge}
                  onChange={(e) => setTeam({ ...team, challenge: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アプローチ・解決方法
                </label>
                <textarea
                  value={team.approach}
                  onChange={(e) => setTeam({ ...team, approach: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* メンバー */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">チームメンバー</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                placeholder="メンバー名を入力"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
              />
              <button
                type="button"
                onClick={addMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {team.members.map((member, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-800">{member}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 使用技術 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">使用技術</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={technologyInput}
                onChange={(e) => setTechnologyInput(e.target.value)}
                placeholder="使用技術を入力"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              />
              <button
                type="button"
                onClick={addTechnology}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                追加
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {team.technologies.map((tech, index) => (
                <div key={index} className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-green-800">{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push(`/teams/${params.id}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}