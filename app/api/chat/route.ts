// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { ChatMessage } from '@/lib/models/Chat';

// チャットメッセージを取得
export async function GET(request: NextRequest) {
  try {
    console.log('💬 チャットメッセージ取得リクエスト');
    
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since'); // タイムスタンプフィルター用
    
    let query = {};
    if (since) {
      query = { timestamp: { $gt: new Date(since) } };
    }
    
    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })  // 最新順
      .limit(Math.min(limit, 100))  // 最大100件まで
      .lean();  // パフォーマンス向上
    
    // 古い順に並び替えて返す（チャット表示用）
    const reversedMessages = messages.reverse();
    
    console.log(`✅ チャットメッセージ取得成功: ${reversedMessages.length}件`);
    
    return NextResponse.json({
      success: true,
      data: reversedMessages,
      count: reversedMessages.length
    });

  } catch (error) {
    console.error('❌ チャットメッセージ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'メッセージの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// チャットメッセージを送信
export async function POST(request: NextRequest) {
  try {
    console.log('📝 チャットメッセージ送信リクエスト');
    
    const body = await request.json();
    const { message, author } = body;
    
    // バリデーション
    if (!message || !author) {
      return NextResponse.json(
        { success: false, error: 'メッセージと名前は必須です' },
        { status: 400 }
      );
    }
    
    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: 'メッセージは500文字以内で入力してください' },
        { status: 400 }
      );
    }
    
    if (author.length > 50) {
      return NextResponse.json(
        { success: false, error: '名前は50文字以内で入力してください' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // セッションから追加情報を取得（ログイン済みの場合）
    const session = await getServerSession();
    
    // IPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const chatMessage = new ChatMessage({
      message: message.trim(),
      author: author.trim(),
      authorEmail: session?.user?.email || undefined,
      ipAddress: ipAddress,
      timestamp: new Date()
    });
    
    const savedMessage = await chatMessage.save();
    
    console.log('✅ チャットメッセージ送信成功:', {
      id: savedMessage._id,
      author: savedMessage.author,
      messageLength: savedMessage.message.length
    });
    
    return NextResponse.json({
      success: true,
      data: savedMessage,
      message: 'メッセージを送信しました'
    });

  } catch (error) {
    console.error('❌ チャットメッセージ送信エラー:', error);
    return NextResponse.json(
      { success: false, error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    );
  }
}

// チャットメッセージを削除（管理者用）
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ チャットメッセージ削除リクエスト');
    
    const session = await getServerSession();
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    
    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'メッセージIDが必要です' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const deletedMessage = await ChatMessage.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      return NextResponse.json(
        { success: false, error: 'メッセージが見つかりません' },
        { status: 404 }
      );
    }
    
    console.log('✅ チャットメッセージ削除成功:', messageId);
    
    return NextResponse.json({
      success: true,
      message: 'メッセージを削除しました'
    });

  } catch (error) {
    console.error('❌ チャットメッセージ削除エラー:', error);
    return NextResponse.json(
      { success: false, error: 'メッセージの削除に失敗しました' },
      { status: 500 }
    );
  }
}