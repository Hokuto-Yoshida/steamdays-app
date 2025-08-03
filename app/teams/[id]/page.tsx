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
  hearts: number;
  comments: Comment[];
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
        // 投票成功
        setTeam(result.data);
        setShowVoteModal(false);
        setVoteReason('');
        setHasVoted(true);
        markTeamAsVoted(teamId);
        
        // 成功メッセージを表示
        alert('投票ありがとうございます！❤️');
      } else {
        // エラー処理
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ナビゲーションバー */}
      <Navbar 
        title={`${team.name} のプロジェクト`}
        showBackButton={true}
        backUrl="/"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロジェクト詳細 */}
          <div className="lg:col-span-2">
            {/* プロジェクト概要 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">📋 プロジェクト概要</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">プロジェクト名</h3>
                  <p className="text-gray-800 font-medium">{team.title}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">プロジェクト説明</h3>
                  <p className="text-gray-600">{team.description}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">解決したい課題</h3>
                  <p className="text-gray-600">{team.challenge}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">アプローチ</h3>
                  <p className="text-gray-600">{team.approach}</p>
                </div>
              </div>
            </div>

            {/* アプリ体験エリア */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🎮 アプリを体験してみよう</h2>
              
              {/* Scratchプロジェクト埋め込みエリア */}
              {team.scratchUrl ? (
                <div className="mb-4">
                  {!isFullscreen ? (
                    <div className="relative">
                      <iframe
                        src={team.scratchUrl}
                        width="100%"
                        height="400"
                        className="border rounded-lg"
                        title={`${team.name} - Scratchプロジェクト`}
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm hover:bg-opacity-70"
                        >
                          🔍 拡大
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                      <div className="w-full h-full max-w-6xl max-h-full bg-white rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                          <h3 className="font-semibold">{team.title}</h3>
                          <button
                            onClick={() => setIsFullscreen(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                          >
                            ✕ 閉じる
                          </button>
                        </div>
                        <iframe
                          src={team.scratchUrl}
                          width="100%"
                          height="calc(100% - 70px)"
                          title={`${team.name} - Scratchプロジェクト`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
                  <div className="w-full h-64 bg-green-100 rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🐱</div>
                      <p className="text-green-700 font-medium">Scratchプロジェクト</p>
                      <p className="text-green-600 text-sm">準備中...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {team.scratchUrl && (
                  <a
                    href={team.scratchUrl.replace('/embed', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    🐱 Scratchで開く
                  </a>
                )}
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
                  💻 コードを見る
                </button>
              </div>
            </div>
          </div>

          {/* サイドバー */}
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
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700">メンバー</h4>
                  <p className="text-gray-600 text-sm">{team.members.join('、')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">使用技術</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {team.technologies.map((tech) => (
                      <span key={tech} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">開発期間</h4>
                  <p className="text-gray-600 text-sm">4ヶ月間</p>
                </div>
              </div>
            </div>

            {/* 最近のコメント */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">💬 最近のコメント</h3>
                <div className="space-y-3">
                    {team.comments.length > 0 ? (
                    team.comments.slice(-3).map((comment, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-3">
                        <p className="text-sm text-gray-600">&quot;{comment.reason}&quot;</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {comment.author} • {new Date(comment.timestamp).toLocaleDateString('ja-JP')}
                        </p>
                        </div>
                    ))
                    ) : (
                    <p className="text-gray-500 text-sm">まだコメントがありません</p>
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
              このプロジェクトの良かった点や感想を教えてください（任意）
            </p>
            <textarea
              value={voteReason}
              onChange={(e) => setVoteReason(e.target.value)}
              placeholder="例：アイデアが素晴らしい、デザインが美しい、技術的に興味深い..."
              className="w-full border border-gray-300 rounded-md p-3 h-24 text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleVote}
                disabled={voting || hasVoted}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  voting || hasVoted
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