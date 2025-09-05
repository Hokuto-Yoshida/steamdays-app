// app/api/teams/[id]/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { TeamChatMessage } from '@/lib/models/TeamChat';

// チーム専用チャットメッセージを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    console.log(`💬 チーム${teamId}のチャットメッセージ取得リクエスト`);
    
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since');
    
    let query: any = { teamId };
    if (since) {
      query.timestamp = { $gt: new Date(since) };
    }
    
    const messages = await TeamChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 100))
      .lean();
    
    const reversedMessages = messages.reverse();
    
    console.log(`✅ チーム${teamId}のチャットメッセージ取得成功: ${reversedMessages.length}件`);
    
    return NextResponse.json({
      success: true,
      data: reversedMessages,
      count: reversedMessages.length
    });

  } catch (error) {
    console.error('❌ チームチャットメッセージ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'メッセージの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// チーム専用チャットメッセージを送信
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    console.log(`📝 チーム${teamId}のチャットメッセージ送信リクエスト`);
    
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
    
    // セッション情報を取得
    const session = await getServerSession();
    
    // IPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? 
                     forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const teamChatMessage = new TeamChatMessage({
      teamId,
      message: message.trim(),
      author: author.trim(),
      authorEmail: session?.user?.email || undefined,
      ipAddress: ipAddress,
      timestamp: new Date()
    });
    
    const savedMessage = await teamChatMessage.save();
    
    console.log('✅ チームチャットメッセージ送信成功:', {
      id: savedMessage._id,
      teamId,
      author: savedMessage.author,
      messageLength: savedMessage.message.length
    });
    
    return NextResponse.json({
      success: true,
      data: savedMessage,
      message: 'メッセージを送信しました'
    });

  } catch (error) {
    console.error('❌ チームチャットメッセージ送信エラー:', error);
    return NextResponse.json(
      { success: false, error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    );
  }
}