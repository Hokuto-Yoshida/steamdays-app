import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function GET(request: NextRequest) {
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

    // 全チームの詳細データを取得
    const teams = await Team.find({}).sort({ hearts: -1 });

    // CSV形式のデータを生成
    const csvHeader = 'チーム名,プロジェクトタイトル,ハート数,コメント数,メンバー,使用技術,ScratchURL,コメント詳細\n';
    
    const csvRows = teams.map((team, index) => {
      const rank = index + 1;
      const members = team.members.join('; ');
      const technologies = team.technologies.join('; ');
      const commentsDetail = team.comments.map((comment: any) => 
        `${comment.author || '匿名'}: ${comment.reason} (${new Date(comment.timestamp).toLocaleString('ja-JP')})`
      ).join(' | ');
      
      return [
        `"${team.name}"`,
        `"${team.title}"`,
        team.hearts,
        team.comments.length,
        `"${members}"`,
        `"${technologies}"`,
        `"${team.scratchUrl || ''}"`,
        `"${commentsDetail}"`
      ].join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // レスポンスヘッダーを設定
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `steam-days-votes-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Export votes error:', error);
    return NextResponse.json({
      success: false,
      error: 'エクスポート中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}