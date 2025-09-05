'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  _id: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: string;
}

interface LiveChatProps {
  className?: string;
}

export default function LiveChat({ className = '' }: LiveChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // セッションから名前を自動設定
  useEffect(() => {
    if (session?.user?.name && !authorName) {
      setAuthorName(session.user.name);
    }
  }, [session, authorName]);

  // メッセージを最下部にスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 初回メッセージ読み込み
  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch('/api/chat?limit=100');
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data || []);
        setIsConnected(true);
        setTimeout(scrollToBottom, 100);
      } else {
        console.error('メッセージ取得エラー:', result.error);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('チャット読み込みエラー:', error);
      setIsConnected(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 新しいメッセージをポーリング
  const pollNewMessages = async () => {
    if (messages.length === 0) return;
    
    try {
      const lastMessage = messages[messages.length - 1];
      const response = await fetch(`/api/chat?since=${lastMessage.timestamp}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setMessages(prev => [...prev, ...result.data]);
        setTimeout(scrollToBottom, 100);
      }
      setIsConnected(true);
    } catch (error) {
      console.error('新メッセージ取得エラー:', error);
      setIsConnected(false);
    }
  };

  // ポーリング開始
  useEffect(() => {
    fetchMessages();
    
    // 2秒間隔でポーリング
    pollIntervalRef.current = setInterval(pollNewMessages, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [messages.length]);

  // メッセージ送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !authorName.trim() || sending) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          author: authorName.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setNewMessage('');
        // 新しいメッセージを即座に表示
        setMessages(prev => [...prev, result.data]);
        setTimeout(scrollToBottom, 100);
      } else {
        alert('メッセージ送信に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージ送信中にエラーが発生しました');
    } finally {
      setSending(false);
    }
  };

  // チャットリセット機能（管理者専用）
  const handleResetChat = async () => {
    if (!session?.user || session.user.role !== 'admin') return;
    
    setResetting(true);
    try {
      const response = await fetch('/api/chat/reset', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages([]);
        setShowResetModal(false);
        alert(`チャットをリセットしました。${result.data.deletedCount}件のメッセージを削除しました。`);
      } else {
        alert('チャットリセットに失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('チャットリセットエラー:', error);
      alert('チャットリセット中にエラーが発生しました');
    } finally {
      setResetting(false);
    }
  };

  // 時間フォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ユーザー名の色を生成
  const getUserColor = (author: string) => {
    const colors = [
      'text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600', 
      'text-pink-600', 'text-indigo-600', 'text-teal-600', 'text-orange-600'
    ];
    let hash = 0;
    for (let i = 0; i < author.length; i++) {
      hash = author.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg border h-96 flex flex-col ${className}`}>
        {/* チャットヘッダー */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">💬 全体チャット</h3>
              <p className="text-xs text-gray-500">
                {loading ? '読み込み中...' : `${messages.length}件のメッセージ`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 管理者専用リセットボタン */}
            {session?.user?.role === 'admin' && (
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="チャットをリセット"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                リセット
              </button>
            )}
            
            <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'LIVE' : 'オフライン'}
            </div>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-3">💭</div>
              <p className="text-sm text-center">まだメッセージがありません</p>
              <p className="text-xs text-center mt-1">最初のメッセージを送ってみませんか？</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message._id} className="flex items-start gap-2 text-sm">
                {/* タイムスタンプ */}
                <span className="text-xs text-gray-400 mt-0.5 min-w-[3rem]">
                  {formatTime(message.timestamp)}
                </span>
                
                {/* ユーザー名 */}
                <span className={`font-medium min-w-[4rem] truncate ${getUserColor(message.author)}`}>
                  {message.author}:
                </span>
                
                {/* メッセージ内容 */}
                <span className="text-gray-800 break-words flex-1">
                  {message.message}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* メッセージ入力エリア */}
        <div className="border-t bg-white p-4 rounded-b-lg">
          <form onSubmit={sendMessage} className="space-y-3">
            {/* 名前入力（未ログインの場合） */}
            {!session && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 min-w-[3rem]">名前:</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="お名前を入力"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={50}
                  required
                />
              </div>
            )}
            
            {/* メッセージ入力 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力してEnterで送信..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
                disabled={sending}
                required
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || !authorName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    送信中
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    送信
                  </>
                )}
              </button>
            </div>
            
            {/* 使用ガイド */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>💡 Enterキーでも送信できます</span>
                <span className="hidden sm:inline">🎉 みんなで楽しくチャットしましょう！</span>
              </div>
              <span className={`${newMessage.length > 450 ? 'text-red-500' : ''}`}>
                {newMessage.length}/500
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* リセット確認モーダル */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">チャットリセットの確認</h3>
                <p className="text-sm text-gray-500">この操作は取り消せません</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                全てのチャットメッセージ（{messages.length}件）を削除します。
              </p>
              <p className="text-sm text-gray-500">
                削除されたメッセージは復元できません。本当に実行しますか？
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={resetting}
              >
                キャンセル
              </button>
              <button
                onClick={handleResetChat}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    削除中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    削除実行
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}