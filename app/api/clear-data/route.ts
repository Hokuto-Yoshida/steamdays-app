import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Team, Vote } from '@/lib/models/Team';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { clearType } = body;

    const result = { message: '', details: {} as Record<string, number> };

    switch (clearType) {
      case 'teams':
        // 全チームを削除
        const teamResult = await Team.deleteMany({});
        result.message = `${teamResult.deletedCount}件のチームを削除しました`;
        result.details = { teamsDeleted: teamResult.deletedCount };
        break;

      case 'votes':
        // 投票データのみリセット（チームは残す）
        await Team.updateMany({}, {
          $set: {
            hearts: 0,
            comments: [],
            updatedAt: new Date()
          }
        });
        const voteResult = await Vote.deleteMany({});
        result.message = `投票データをリセットしました（投票記録: ${voteResult.deletedCount}件削除）`;
        result.details = { votesDeleted: voteResult.deletedCount };
        break;

      case 'users':
        // 管理者以外のユーザーを削除
        const userResult = await User.deleteMany({ 
          role: { $ne: 'admin' } 
        });
        result.message = `${userResult.deletedCount}件のユーザー（管理者以外）を削除しました`;
        result.details = { usersDeleted: userResult.deletedCount };
        break;

      case 'all':
        // 全データを削除（管理者ユーザーは残す）
        const allTeamResult = await Team.deleteMany({});
        const allVoteResult = await Vote.deleteMany({});
        const allUserResult = await User.deleteMany({ 
          role: { $ne: 'admin' } 
        });
        result.message = `全データを削除しました（チーム: ${allTeamResult.deletedCount}、投票: ${allVoteResult.deletedCount}、ユーザー: ${allUserResult.deletedCount}）`;
        result.details = { 
          teamsDeleted: allTeamResult.deletedCount,
          votesDeleted: allVoteResult.deletedCount,
          usersDeleted: allUserResult.deletedCount
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: '無効なクリアタイプです。teams, votes, users, all のいずれかを指定してください。'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        clearType,
        timestamp: new Date().toISOString(),
        ...result.details
      }
    });

  } catch (error) {
    console.error('Clear data error:', error);
    return NextResponse.json({
      success: false,
      error: 'データクリア中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}