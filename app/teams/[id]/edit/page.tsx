'use client';

import { useState, useEffect, useCallback } from 'react';
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
  imageUrl: string; // Base64画像データまたはURL
  hearts: number; // ハート数追加
  comments: { reason: string; timestamp: Date; author: string }[]; // コメント追加
  status?: string; // ステータス追加
}

export default function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [technologyInput, setTechnologyInput] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // paramsを解決してteamIdを設定
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTeamId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // 権限チェック
  const canEdit = useCallback(() => {
    if (!session?.user || !teamId) return false;
    return session.user.role === 'admin' || 
           (session.user.role === 'presenter' && session.user.teamId === teamId);
  }, [session, teamId]);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) throw new Error('チーム情報の取得に失敗しました');
      
      const result = await response.json();
      if (result.success) {
        setTeam(result.data);
        setImagePreview(result.data.imageUrl || '');
      } else {
        throw new Error(result.error || 'チーム情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('Team fetch error:', error);
      setError('チーム情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // 画像ファイルをBase64に変換
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 画像ファイルの処理
  const handleImageFile = async (file: File) => {
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      setError('画像ファイルは5MB以下にしてください');
      return;
    }

    setImageUploading(true);
    setError('');

    try {
      const base64 = await convertToBase64(file);
      
      if (team) {
        setTeam({ ...team, imageUrl: base64 });
        setImagePreview(base64);
      }
    } catch (error) {
      console.error('Image conversion error:', error);
      setError('画像の処理に失敗しました');
    } finally {
      setImageUploading(false);
    }
  };

  // ドラッグ&ドロップイベント
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  // ファイル選択イベント
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  // 画像削除
  const removeImage = () => {
    if (team) {
      setTeam({ ...team, imageUrl: '' });
      setImagePreview('');
    }
  };

  useEffect(() => {
    if (status === 'loading' || !teamId) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (!canEdit()) {
      router.push('/');
      return;
    }

    fetchTeam();
  }, [session, status, teamId, canEdit, fetchTeam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !canEdit() || !teamId) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
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

      router.push(`/teams/${teamId}`);
    } catch (error) {
      console.error('Save error:', error);
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

  if (loading || !teamId) {
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

          {/* 画像アップロード */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              🖼️ プロジェクト画像
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* アップロードエリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  画像をアップロード
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {imageUploading ? (
                    <div className="py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">アップロード中...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        画像をドラッグ&ドロップ
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        またはクリックしてファイルを選択
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        ファイルを選択
                      </label>
                    </>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p>• 対応形式: JPG, PNG, GIF</p>
                  <p>• 最大ファイルサイズ: 5MB</p>
                  <p>• 推奨サイズ: 800×600px</p>
                </div>
              </div>

              {/* プレビューエリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プレビュー
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
                  {imagePreview ? (
                    <div className="text-center w-full h-full">
                      <img
                        src={imagePreview}
                        alt="プロジェクト画像プレビュー"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md mx-auto"
                        onError={() => setImagePreview('')}
                      />
                      <div className="mt-2 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-800 text-sm underline"
                        >
                          画像を削除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg">画像をアップロードすると<br />ここにプレビューが表示されます</p>
                    </div>
                  )}
                </div>
              </div>
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
              onClick={() => router.push(`/teams/${teamId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || imageUploading}
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