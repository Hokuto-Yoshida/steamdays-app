// components/LiveChat.tsx
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
            <h3 className="font-semibold text-gray-800">💬 ライブチャット</h3>
            <p className="text-xs text-gray-500">
              {loading ? '読み込み中...' : `${messages.length}件のメッセージ`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
  );
}