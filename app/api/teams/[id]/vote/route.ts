import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team, Vote } from '@/lib/models/Team';

function getClientIP(request: NextRequest): string {
  // Vercelやその他のホスティングサービス用
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare用
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // 開発環境用のフォールバック（ランダムなIDを生成）
  if (process.env.NODE_ENV === 'development') {
    // セッションごとに一意なIDを生成（開発用）
    return `dev-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  // 最終フォールバック
  return '127.0.0.1';
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // paramsを非同期で取得
    const params = await context.params;
    const { id: teamId } = params;
    
    await dbConnect();
    
    const { reason, clientId } = await request.json();
    const ipAddress = getClientIP(request);
    
    // IPアドレスまたはクライアントIDで重複チェック
    const existingVote = await Vote.findOne({
      $or: [
        { teamId, ipAddress },
        { teamId, clientId: clientId }
      ]
    });
    
    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'Already voted for this team' },
        { status: 400 }
      );
    }
    
    // チームの存在確認
    const team = await Team.findOne({ id: teamId });
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // トランザクション的に処理
    const session = await Team.startSession();
    session.startTransaction();
    
    try {
      // 投票記録を保存
      const vote = new Vote({
        teamId,
        ipAddress,
        clientId: clientId || null,
        reason: reason || ''
      });
      await vote.save({ session });
      
      // チームのハート数を増加
      await Team.updateOne(
        { id: teamId },
        { 
          $inc: { hearts: 1 },
          $push: reason ? {
            comments: {
              reason,
              timestamp: new Date(),
              author: '匿名ユーザー',
              ipAddress
            }
          } : {}
        },
        { session }
      );
      
      await session.commitTransaction();
      
      // 更新されたチーム情報を取得
      const updatedTeam = await Team.findOne({ id: teamId });
      
      return NextResponse.json({
        success: true,
        data: updatedTeam,
        message: 'Vote recorded successfully'
      });
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
    
  } catch (error) {
    console.error('Vote API Error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'Already voted for this team' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}