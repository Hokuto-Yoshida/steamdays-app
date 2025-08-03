import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; 
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: '管理者権限が必要です'
      }, { status: 403 });
    }

    await dbConnect();

    // 全チームの投票数とコメントをリセット
    const result = await Team.updateMany(
      {},
      {
        $set: {
          hearts: 0,
          comments: [],
          updatedAt: new Date()
        }
      }
    );

    // Votesコレクションも削除（重複防止データをクリア）
    try {
      const { default: mongoose } = await import('mongoose');
      await mongoose.connection.db?.collection('votes').deleteMany({});
    } catch (error) {
      console.warn('Votes collection clear failed:', error);
      // Votesコレクションの削除に失敗しても続行
    }

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount}チームの投票データをリセットしました`,
      data: {
        modifiedCount: result.modifiedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Reset votes error:', error);
    return NextResponse.json({
      success: false,
      error: '投票リセット中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}