// components/RealtimeChat.tsx
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

interface RealtimeChatProps {
  className?: string;
}

export default function RealtimeChat({ className = '' }: RealtimeChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
      
      const response = await fetch('/api/chat?limit=50');
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

  // ポーリング開始/停止
  useEffect(() => {
    fetchMessages();
    
    if (isExpanded) {
      // チャットが展開されている時のみポーリング
      pollIntervalRef.current = setInterval(pollNewMessages, 2000); // 2秒間隔
    } else {
      // 縮小時は頻度を下げる
      pollIntervalRef.current = setInterval(pollNewMessages, 10000); // 10秒間隔
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isExpanded, messages.length]);

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

  // 時間フォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}時間前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 自分のメッセージかどうか判定
  const isMyMessage = (message: ChatMessage) => {
    return session?.user?.email && message.authorEmail === session.user.email;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
      isExpanded ? 'h-96' : 'h-16'
    } ${className}`}>
      {/* チャットヘッダー */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
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
          {!isConnected && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              接続エラー
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* チャット内容（展開時のみ表示） */}
      {isExpanded && (
        <>
          {/* メッセージエリア */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 h-64"
            style={{ maxHeight: '240px' }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💭</div>
                <p className="text-sm">まだメッセージがありません</p>
                <p className="text-xs">最初のメッセージを送ってみませんか？</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isMyMessage(message)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${
                        isMyMessage(message) ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {isMyMessage(message) ? 'あなた' : message.author}
                      </span>
                      <span className={`text-xs ${
                        isMyMessage(message) ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words">{message.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力エリア */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="space-y-3">
              {/* 名前入力（未ログインの場合） */}
              {!session && (
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="お名前を入力"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                  required
                />
              )}
              
              {/* メッセージ入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={500}
                  disabled={sending}
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim() || !authorName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {sending ? '送信中...' : '送信'}
                </button>
              </div>
              
              {/* 文字数カウンター */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>💡 みんなで楽しくチャットしましょう！</span>
                <span>{newMessage.length}/500</span>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}