// app/api/teams/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team, Vote } from '@/lib/models/Team';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🗳️ 投票リクエスト受信 - チームID:', id);
    
    const body = await request.json();
    const { reason, clientId } = body;
    
    console.log('📝 投票データ:', { 
      reason: reason ? `[${reason.length}文字]` : 'なし', 
      clientId 
    });
    
    // バリデーション: コメント必須
    if (!reason || !reason.trim()) {
      console.log('❌ バリデーションエラー: コメントが必須です');
      return NextResponse.json(
        { success: false, error: '投票するにはコメント（感想・理由）が必要です' },
        { status: 400 }
      );
    }
    
    if (reason.trim().length < 3) {
      console.log('❌ バリデーションエラー: コメントが短すぎます');
      return NextResponse.json(
        { success: false, error: 'コメントは3文字以上で入力してください' },
        { status: 400 }
      );
    }
    
    if (reason.length > 500) {
      console.log('❌ バリデーションエラー: コメントが長すぎます');
      return NextResponse.json(
        { success: false, error: 'コメントは500文字以内で入力してください' },
        { status: 400 }
      );
    }
    
    if (!clientId) {
      console.log('❌ バリデーションエラー: クライアントIDが必要です');
      return NextResponse.json(
        { success: false, error: 'クライアントIDが必要です' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // IPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log('🔍 既投票チェック - IP:', ipAddress, 'ClientID:', clientId);
    
    // 既投票チェック（全チーム対象・IPアドレスまたはクライアントIDで）
    const existingVote = await Vote.findOne({
      $or: [
        { ipAddress: ipAddress },
        { clientId: clientId }
      ]
    });
    
    if (existingVote) {
      console.log('❌ 既投票検出:', {
        votedTeam: existingVote.teamId,
        currentTeam: id,
        ipAddress: existingVote.ipAddress,
        clientId: existingVote.clientId
      });
      
      // 既に投票したチーム情報を取得
      const votedTeam = await Team.findOne({ id: existingVote.teamId });
      const votedTeamName = votedTeam ? votedTeam.name : '不明なチーム';
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Already voted',
          message: `既に${votedTeamName}に投票済みです。投票は1人1回までです。`,
          votedTeam: {
            id: existingVote.teamId,
            name: votedTeamName
          }
        },
        { status: 400 }
      );
    }

    // チーム存在確認
    const team = await Team.findOne({ id });
    if (!team) {
      console.log('❌ チームが見つかりません:', id);
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    console.log('💾 投票記録保存中...');
    
    // 投票記録を保存
    const vote = new Vote({
      teamId: id,
      ipAddress: ipAddress,
      clientId: clientId,
      reason: reason.trim(),
      timestamp: new Date()
    });
    
    await vote.save();
    console.log('✅ 投票記録保存完了:', vote._id);

    // チームの投票数とコメントを更新
    const updatedTeam = await Team.findOneAndUpdate(
      { id },
      {
        $inc: { hearts: 1 },
        $push: {
          comments: {
            reason: reason.trim(),
            timestamp: new Date(),
            author: '匿名ユーザー',
            ipAddress: ipAddress
          }
        }
      },
      { new: true }
    );

    if (!updatedTeam) {
      console.log('❌ チーム更新に失敗');
      return NextResponse.json(
        { success: false, error: 'Failed to update team' },
        { status: 500 }
      );
    }

    console.log('✅ 投票完了 - チーム:', team.name, '新しい投票数:', updatedTeam.hearts);

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: `${team.name}に投票しました！`
    });

  } catch (error) {
    console.error('❌ 投票処理エラー:', error);
    
    // 重複キーエラーの場合
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'Already voted' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}