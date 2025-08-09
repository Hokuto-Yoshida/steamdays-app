import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// POST メソッド - 既存チームに editingAllowed フィールドを追加
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // editingAllowed フィールドがないチームを検索
    const teamsWithoutEditingAllowed = await Team.find({ 
      editingAllowed: { $exists: false } 
    });

    console.log(`🔄 移行対象チーム数: ${teamsWithoutEditingAllowed.length}`);

    // 各チームに editingAllowed: false を追加
    const updatePromises = teamsWithoutEditingAllowed.map(team => 
      Team.findByIdAndUpdate(
        team._id,
        { 
          editingAllowed: false, // デフォルトは無効
          updatedAt: new Date()
        },
        { new: true }
      )
    );

    const updatedTeams = await Promise.all(updatePromises);

    console.log(`✅ ${updatedTeams.length}チームの移行完了`);

    return NextResponse.json({
      success: true,
      message: `${updatedTeams.length}チームに editingAllowed フィールドを追加しました`,
      data: {
        migratedCount: updatedTeams.length,
        teams: updatedTeams.map(team => ({
          id: team.id,
          name: team.name,
          editingAllowed: team.editingAllowed
        }))
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}