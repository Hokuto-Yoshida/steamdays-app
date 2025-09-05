// app/api/chat/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { ChatMessage } from '@/lib/models/Chat';

// 全チャットメッセージを削除
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 全チャットメッセージ削除リクエスト');
    
    await dbConnect();
    
    // 削除前に件数を確認
    const messageCount = await ChatMessage.countDocuments();
    console.log(`📊 削除対象メッセージ数: ${messageCount}件`);
    
    // セッション情報を取得（ログ用）
    const session = await getServerSession();
    const executorEmail = session?.user?.email || 'unknown';
    
    // 全チャットメッセージを削除
    const deleteResult = await ChatMessage.deleteMany({});
    
    console.log('✅ 全チャットメッセージ削除完了:', {
      deletedCount: deleteResult.deletedCount,
      previousCount: messageCount,
      executorEmail: executorEmail
    });
    
    return NextResponse.json({
      success: true,
      message: `${deleteResult.deletedCount}件のチャットメッセージを削除しました`,
      data: {
        deletedCount: deleteResult.deletedCount,
        previousCount: messageCount
      }
    });

  } catch (error) {
    console.error('❌ 全チャットメッセージ削除エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'チャットメッセージの削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// チャット統計取得
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // チャットメッセージ統計を取得
    const totalMessages = await ChatMessage.countDocuments();
    const oldestMessage = await ChatMessage.findOne().sort({ timestamp: 1 }).select('timestamp author');
    const newestMessage = await ChatMessage.findOne().sort({ timestamp: -1 }).select('timestamp author');
    
    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        oldestMessage,
        newestMessage,
        canReset: totalMessages > 0
      }
    });

  } catch (error) {
    console.error('❌ チャット統計取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'チャット統計の取得に失敗しました' },
      { status: 500 }
    );
  }
}