import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; 
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status } = body;

    // ステータスのバリデーション
    const validStatuses = ['upcoming', 'live', 'ended'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: '無効なステータスです。upcoming, live, ended のいずれかを指定してください。'
      }, { status: 400 });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { id: params.id },
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return NextResponse.json({
        success: false,
        error: 'チームが見つかりません'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'ステータスが更新されました',
      data: {
        teamId: updatedTeam.id,
        teamName: updatedTeam.name,
        status: updatedTeam.status,
        updatedAt: updatedTeam.updatedAt
      }
    });

  } catch (error) {
    console.error('Team status update error:', error);
    return NextResponse.json({
      success: false,
      error: 'ステータス更新中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}