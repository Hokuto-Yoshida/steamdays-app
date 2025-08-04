// app/api/teams/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🎯 チームステータス更新リクエスト - チームID:', id);
    
    const body = await request.json();
    const { status } = body;
    
    console.log('📝 新しいステータス:', status);
    
    // ステータスのバリデーション
    const validStatuses = ['upcoming', 'live', 'ended'];
    if (!status || !validStatuses.includes(status)) {
      console.log('❌ バリデーションエラー: 無効なステータス');
      return NextResponse.json(
        { success: false, error: '有効なステータスを指定してください (upcoming, live, ended)' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // チーム存在確認とステータス更新
    const updatedTeam = await Team.findOneAndUpdate(
      { id },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedTeam) {
      console.log('❌ チームが見つかりません:', id);
      return NextResponse.json(
        { success: false, error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ ステータス更新成功:', {
      teamId: updatedTeam.id,
      teamName: updatedTeam.name,
      newStatus: updatedTeam.status
    });

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: `${updatedTeam.name}のステータスを「${getStatusLabel(status)}」に更新しました`
    });

  } catch (error) {
    console.error('❌ ステータス更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ステータスラベルを取得
function getStatusLabel(status: string): string {
  const statusLabels: { [key: string]: string } = {
    'upcoming': '開始前',
    'live': 'ピッチ中',
    'ended': '終了'
  };
  return statusLabels[status] || status;
}