'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateClientId, hasVotedForTeam, markTeamAsVoted } from '@/lib/utils/client';
import Navbar from '@/components/Navbar';
import TeamChat from '@/components/TeamChat';
import { useSession } from 'next-auth/react';

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

interface VoteStatus {
  hasVoted: boolean;
  votedTeam?: { id: string; name: string; title: string } | null;
}

function getScratchEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed')) return url;
  const projectIdMatch = url.match(/projects\/(\d+)/);
  if (projectIdMatch) {
    return `https://scratch.mit.edu/projects/${projectIdMatch[1]}/embed`;
  }
  return url;
}

export default function TeamDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [teamId, setTeamId] = useState<string>('');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteReason, setVoteReason] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 追加: グローバル投票ステータス
  const [globalVoteStatus, setGlobalVoteStatus] = useState<VoteStatus>({ 
    hasVoted: false, 
    votedTeam: null 
  });

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTeamId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!teamId) return;

    async function fetchTeamAndVoteStatus() {
      try {
        // 1. チーム情報取得
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        const teamResult = await teamResponse.json();
        
        if (teamResult.success) {
          setTeam(teamResult.data);
          setImageError(false);
        } else {
          console.error('Team fetch error:', teamResult.error);
        }

        // 2. グローバル投票ステータス確認
        const clientId = generateClientId();
        const voteStatusResponse = await fetch('/api/vote-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId })
        });

        const voteStatusResult = await voteStatusResponse.json();
        
        if (voteStatusResult.success) {
          setGlobalVoteStatus({
            hasVoted: voteStatusResult.hasVoted,
            votedTeam: voteStatusResult.votedTeam
          });
          
          // 既存のhasVotedも更新（後方互換性のため）
          setHasVoted(voteStatusResult.hasVoted);
          
          console.log('投票ステータス:', voteStatusResult.hasVoted ? 
            `投票済み（${voteStatusResult.votedTeam?.name}）` : '未投票');
        }
        
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamAndVoteStatus();
    // 従来のローカルチェックは削除
    // setHasVoted(hasVotedForTeam(teamId));
  }, [teamId]);

  // 投票ボタンの表示内容を決定
  const getVoteButtonContent = () => {
    if (globalVoteStatus.hasVoted) {
      if (globalVoteStatus.votedTeam && globalVoteStatus.votedTeam.id === teamId) {
        return '✅ このプロジェクトに投票済み';
      } else {
        return `✅ ${globalVoteStatus.votedTeam?.name || '他のプロジェクト'}に投票済み`;
      }
    }
    
    if (voting) {
      return '⏳ 投票中...';
    }
    
    return '❤️ 投票する';
  };

  // 投票ボタンのスタイルを決定
  const getVoteButtonStyle = () => {
    if (globalVoteStatus.hasVoted) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    if (voting) {
      return 'bg-red-300 text-red-600 cursor-not-allowed';
    }
    
    return 'bg-red-500 text-white hover:bg-red-600';
  };

  const handleVote = async () => {
    if (!team || voting || globalVoteStatus.hasVoted || !teamId) return;

    setVoting(true);
    try {
      const clientId = generateClientId();
      
      const response = await fetch(`/api/teams/${teamId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voteReason, clientId: clientId })
      });

      const result = await response.json();
      
      if (result.success) {
        setTeam(result.data);
        setShowVoteModal(false);
        
        // 投票コメントをチームチャットにも投稿
        const authorName = session?.user?.name || 'ゲスト';
        try {
          await fetch(`/api/teams/${teamId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `💖 投票しました！\n「${voteReason}」`,
              author: authorName
            })
          });
        } catch (chatError) {
          console.error('チャット投稿エラー:', chatError);
        }
        
        setVoteReason('');
        
        // グローバル投票ステータスを更新
        setGlobalVoteStatus({
          hasVoted: true,
          votedTeam: {
            id: teamId,
            name: team.name,
            title: team.title
          }
        });
        setHasVoted(true);
        markTeamAsVoted(teamId);
        alert(`${team.name}に投票しました！`);
      } else {
        if (result.error === 'Already voted') {
          // 既に投票済みの場合、グローバルステータスを更新
          setGlobalVoteStatus({
            hasVoted: true,
            votedTeam: result.votedTeam || null
          });
          setHasVoted(true);
          alert(result.message || '既に投票済みです。投票は1人1回までです。');
        } else {
          alert(result.message || '投票に失敗しました: ' + result.error);
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

  const scratchEmbedUrl = team.scratchUrl ? getScratchEmbedUrl(team.scratchUrl) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar 
        title={`${team.name} のプロジェクト`}
        showBackButton={true}
        backUrl="/"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* カバー画像ヘッダー（投票数表示なし） */}
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
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                  {team.name}
                </span>
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

        {/* メインレイアウト：メインエリア（左）+ サイドバー（右） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインエリア（左側・2/3幅） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. チーム専用チャット（最上部） */}
            <TeamChat 
              teamId={teamId} 
              teamName={team.name}
            />

            {/* 2. アプリ体験エリア */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🎮 アプリを体験してみよう</h2>
              
              {scratchEmbedUrl ? (
                <div className="mb-4">
                  {!isFullscreen ? (
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
                      <div className="absolute top-3 right-3">
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
                      <div className="absolute bottom-3 left-3 bg-green-500 bg-opacity-90 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
                        ▶️ 緑の旗をクリックしてスタート！
                      </div>
                    </div>
                  ) : (
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

              {team.scratchUrl && (
                <div className="flex gap-3">
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
                </div>
              )}
            </div>
          </div>

          {/* サイドバー（右側・1/3幅） */}
          <div className="space-y-6">
            {/* 1. 投票セクション（修正版） */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">💖 このプロジェクトを応援</h3>
              
              {/* 投票ステータスによる表示切り替え */}
              {globalVoteStatus.hasVoted ? (
                <div className="text-center mb-4">
                  <p className="text-gray-600 text-sm mb-2">
                    {globalVoteStatus.votedTeam?.id === teamId 
                      ? 'このプロジェクトに投票していただきありがとうございます！'
                      : `「${globalVoteStatus.votedTeam?.name}」に投票済みです`
                    }
                  </p>
                  {globalVoteStatus.votedTeam?.id !== teamId && (
                    <p className="text-gray-500 text-xs">
                      投票は1人1回までです
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm mb-4 text-center">
                  気に入ったプロジェクトに投票して応援しましょう
                </p>
              )}
              
              <button
                onClick={() => setShowVoteModal(true)}
                disabled={globalVoteStatus.hasVoted || voting}
                className={`w-full py-3 rounded-md font-medium transition-colors ${getVoteButtonStyle()}`}
              >
                {getVoteButtonContent()}
              </button>
            </div>

            {/* 2. プロジェクト概要 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">📋 プロジェクト詳細</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    解決したい課題
                  </h4>
                  <p className="text-gray-600 bg-blue-50 p-3 rounded-md text-sm">{team.challenge}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    アプローチ・解決方法
                  </h4>
                  <p className="text-gray-600 bg-green-50 p-3 rounded-md text-sm">{team.approach}</p>
                </div>
              </div>
            </div>

            {/* 3. チーム情報 */}
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 投票モーダル */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">❤️ 投票する</h3>
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
                disabled={voting || globalVoteStatus.hasVoted || !voteReason.trim()}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  voting || globalVoteStatus.hasVoted || !voteReason.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {voting ? '送信中...' : '投票する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}