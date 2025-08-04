'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateClientId, hasVotedForTeam, markTeamAsVoted } from '@/lib/utils/client';
import Navbar from '@/components/Navbar';

// TypeScript型定義
interface Comment {
  reason: string;
  timestamp: string;
  author: string;
}

interface Team {
  _id: string;
  id: string;
  name: string;
  title: string;
  description: string;
  challenge: string;
  approach: string;
  members: string[];
  technologies: string[];
  scratchUrl?: string;
  imageUrl?: string;
  hearts: number;
  comments: Comment[];
}

// Scratch埋め込みURL変換関数
function getScratchEmbedUrl(url: string): string {
  if (!url) return '';
  
  // 既に埋め込みURLの場合はそのまま返す
  if (url.includes('/embed')) {
    return url;
  }
  
  // 通常のScratchプロジェクトURLから埋め込みURLを生成
  const projectIdMatch = url.match(/projects\/(\d+)/);
  if (projectIdMatch) {
    return `https://scratch.mit.edu/projects/${projectIdMatch[1]}/embed`;
  }
  
  return url;
}

export default function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string>('');
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteReason, setVoteReason] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // paramsを解決してteamIdを設定
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTeamId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // チームデータを取得
  useEffect(() => {
    if (!teamId) return;

    async function fetchTeam() {
      try {
        const response = await fetch(`/api/teams/${teamId}`);
        const result = await response.json();
        
        if (result.success) {
          setTeam(result.data);
          setImageError(false);
        } else {
          console.error('Team fetch error:', result.error);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
    setHasVoted(hasVotedForTeam(teamId));
  }, [teamId]);

  // 投票処理
  const handleVote = async () => {
    if (!team || voting || hasVoted || !teamId) return;

    setVoting(true);
    try {
      const clientId = generateClientId();
      
      const response = await fetch(`/api/teams/${teamId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: voteReason,
          clientId: clientId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTeam(result.data);
        setShowVoteModal(false);
        setVoteReason('');
        setHasVoted(true);
        markTeamAsVoted(teamId);
        alert('投票ありがとうございます！❤️');
      } else {
        if (result.error === 'Already voted for this team') {
          alert('このチームには既に投票済みです');
          setHasVoted(true);
          markTeamAsVoted(teamId);
        } else {
          alert('投票に失敗しました: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('投票中にエラーが発生しました');
    } finally {
      setVoting(false);
    }
  };

  if (loading || !teamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">チーム情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">チームが見つかりません</h2>
          <p className="text-gray-600 mb-4">指定されたチームは存在しないか、削除された可能性があります。</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // Scratch埋め込みURL
  const scratchEmbedUrl = team.scratchUrl ? getScratchEmbedUrl(team.scratchUrl) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar 
        title={`${team.name} のプロジェクト`}
        showBackButton={true}
        backUrl="/"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* カバー画像とチーム情報ヘッダー */}
        <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
          {team.imageUrl && !imageError ? (
            <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
              <img
                src={team.imageUrl}
                alt={`${team.name} のカバー画像`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {team.name}
                  </span>
                  <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white">❤️</span>
                    <span className="text-white font-medium">{team.hearts}</span>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  {team.title}
                </h1>
                <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow line-clamp-2">
                  {team.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-64 md:h-80 lg:h-96 flex items-center justify-center relative">
              <div className="text-center text-white">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {team.name}
                  </span>
                  <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white">❤️</span>
                    <span className="text-white font-medium">{team.hearts}</span>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  {team.title}
                </h1>
                <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto">
                  {team.description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロジェクト詳細 */}
          <div className="lg:col-span-2">
            {/* プロジェクト概要 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">📋 プロジェクト詳細</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    解決したい課題
                  </h3>
                  <p className="text-gray-600 bg-blue-50 p-3 rounded-md">{team.challenge}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    アプローチ・解決方法
                  </h3>
                  <p className="text-gray-600 bg-green-50 p-3 rounded-md">{team.approach}</p>
                </div>
              </div>
            </div>

            {/* アプリ体験エリア */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🎮 アプリを体験してみよう</h2>
              
              {scratchEmbedUrl ? (
                <div className="mb-4">
                  {!isFullscreen ? (
                    // 小さなプレビュー表示（修正版）
                    <div className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                      <iframe
                        src={scratchEmbedUrl}
                        width="100%"
                        height="320"
                        className="border-0 rounded-lg"
                        title={`${team.name} - Scratchプロジェクト`}
                        allowFullScreen
                        loading="lazy"
                      />
                      
                      {/* オーバーレイボタン */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          拡大
                        </button>
                      </div>
                      
                      {/* プレイ誘導オーバーレイ */}
                      <div className="absolute bottom-3 left-3 bg-green-500 bg-opacity-90 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
                        ▶️ 緑の旗をクリックしてスタート！
                      </div>
                    </div>
                  ) : (
                    // フルスクリーンモーダル
                    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
                      <div className="w-full h-full max-w-7xl max-h-full bg-white rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{team.title}</h3>
                              <p className="text-sm text-gray-600">{team.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={team.scratchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              🐱 Scratchで開く
                            </a>
                            <button
                              onClick={() => setIsFullscreen(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                              ✕ 閉じる
                            </button>
                          </div>
                        </div>
                        <iframe
                          src={scratchEmbedUrl}
                          width="100%"
                          height="calc(100% - 70px)"
                          title={`${team.name} - Scratchプロジェクト（フルスクリーン）`}
                          className="border-0"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // プロジェクト準備中の表示
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 text-center mb-4 border-2 border-dashed border-green-200">
                  <div className="w-full h-48 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-semibold text-lg mb-1">Scratchプロジェクト</p>
                      <p className="text-green-600 text-sm">まもなく公開予定...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3">
                {team.scratchUrl && (
                  <a
                    href={team.scratchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Scratchで開く
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* サイドバー - 既存のコードと同じ */}
          <div className="space-y-6">
            {/* 投票セクション */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">💖 このプロジェクトを応援</h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-red-500">{team.hearts}</div>
                <p className="text-gray-600 text-sm">ハート数</p>
              </div>
              <button
                onClick={() => setShowVoteModal(true)}
                disabled={hasVoted || voting}
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  hasVoted 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : voting
                    ? 'bg-red-300 text-red-600 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {hasVoted ? '✅ 投票済み' : voting ? '⏳ 投票中...' : '❤️ ハートを送る'}
              </button>
            </div>

            {/* チーム情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">👥 チーム情報</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    メンバー
                  </h4>
                  <div className="space-y-1">
                    {team.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs">👤</span>
                        </div>
                        <span className="text-gray-700">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    使用技術
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {team.technologies.map((tech, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 最近のコメント */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                最近のコメント
              </h3>
              <div className="space-y-3">
                {team.comments.length > 0 ? (
                  team.comments.slice(-3).reverse().map((comment, index) => (
                    <div key={index} className="border-l-4 border-purple-200 pl-3 py-2 bg-purple-50 rounded-r-md">
                      <p className="text-sm text-gray-700 font-medium mb-1">&quot;{comment.reason}&quot;</p>
                      <p className="text-xs text-gray-500">
                        {comment.author} • {new Date(comment.timestamp).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">💭</div>
                    <p className="text-gray-500 text-sm">まだコメントがありません</p>
                    <p className="text-gray-400 text-xs">最初のハートを送ってみませんか？</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 投票モーダル */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">❤️ ハートを送る</h3>
            <p className="text-gray-600 mb-4">
              このプロジェクトの良かった点や感想を教えてください<span className="text-red-500">（必須）</span>
            </p>
            <textarea
              value={voteReason}
              onChange={(e) => setVoteReason(e.target.value)}
              placeholder="例：アイデアが素晴らしい、デザインが美しい、技術的に興味深い..."
              className="w-full border border-gray-300 rounded-md p-3 h-24 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {voteReason.length}/500文字
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleVote}
                disabled={voting || hasVoted || !voteReason.trim()}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  voting || hasVoted || !voteReason.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {voting ? '送信中...' : 'ハートを送る'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}