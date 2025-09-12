// app/api/vote-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Vote, Team } from '@/lib/models/Team';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;
    
    if (!clientId) {
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
    
    console.log('🔍 投票ステータス確認 - IP:', ipAddress, 'ClientID:', clientId);
    
    // 既投票チェック（IPアドレスまたはクライアントIDで）
    const existingVote = await Vote.findOne({
      $or: [
        { ipAddress: ipAddress },
        { clientId: clientId }
      ]
    });
    
    if (existingVote) {
      // 投票済みの場合、投票したチーム情報を取得
      const votedTeam = await Team.findOne({ id: existingVote.teamId });
      
      return NextResponse.json({
        success: true,
        hasVoted: true,
        votedTeam: {
          id: existingVote.teamId,
          name: votedTeam ? votedTeam.name : '不明なチーム',
          title: votedTeam ? votedTeam.title : '不明'
        }
      });
    }
    
    // 未投票の場合
    return NextResponse.json({
      success: true,
      hasVoted: false,
      votedTeam: null
    });

  } catch (error) {
    console.error('❌ 投票ステータス確認エラー:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}