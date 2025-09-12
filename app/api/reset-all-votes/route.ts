// app/api/reset-all-votes/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team, Vote } from '@/lib/models/Team';

export async function POST() {
  try {
    console.log('🔄 投票完全リセット開始...');
    
    await dbConnect();
    
    // 1. Vote コレクション（投票履歴）を完全削除
    const voteDeleteResult = await Vote.deleteMany({});
    console.log(`✅ 投票履歴削除: ${voteDeleteResult.deletedCount}件`);
    
    // 2. 全チームの投票数とコメントをリセット
    const teamUpdateResult = await Team.updateMany(
      {}, // 全てのチーム
      {
        $set: {
          hearts: 0,
          comments: []
        }
      }
    );
    console.log(`✅ チーム投票数リセット: ${teamUpdateResult.modifiedCount}チーム`);
    
    return NextResponse.json({
      success: true,
      message: `投票を完全にリセットしました（投票履歴: ${voteDeleteResult.deletedCount}件削除、チーム: ${teamUpdateResult.modifiedCount}件更新）`,
      data: {
        votesDeleted: voteDeleteResult.deletedCount,
        teamsUpdated: teamUpdateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ 投票リセットエラー:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: '投票リセット中にエラーが発生しました'
      },
      { status: 500 }
    );
  }
}