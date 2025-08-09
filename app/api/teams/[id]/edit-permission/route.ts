import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// PUT メソッド - 編集権限の切り替え
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { editingAllowed } = body;
    
    // バリデーション
    if (typeof editingAllowed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'editingAllowed must be a boolean' },
        { status: 400 }
      );
    }

    // チーム存在確認
    const team = await Team.findOne({ id });
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // 編集権限を更新
    const updatedTeam = await Team.findOneAndUpdate(
      { id },
      { 
        editingAllowed,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`🔧 チーム${id}の編集権限を${editingAllowed ? 'ON' : 'OFF'}に変更`);

    return NextResponse.json({
      success: true,
      message: `編集権限を${editingAllowed ? '有効' : '無効'}に変更しました`,
      data: {
        teamId: id,
        teamName: updatedTeam.name,
        editingAllowed
      }
    });

  } catch (error) {
    console.error('❌ Edit permission API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update edit permission' },
      { status: 500 }
    );
  }
}