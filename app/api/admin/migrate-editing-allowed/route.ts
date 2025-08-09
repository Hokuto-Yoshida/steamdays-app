import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// POST メソッド - 全チームにeditingAllowedフィールドを一括追加
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
    
    // 全チームの現在の状況を確認
    const allTeams = await Team.find({});
    console.log(`📊 現在のチーム数: ${allTeams.length}`);
    
    // editingAllowedフィールドが存在しないチームを特定
    const teamsWithoutField = allTeams.filter(team => team.editingAllowed === undefined);
    console.log(`🔧 editingAllowedフィールドがないチーム: ${teamsWithoutField.length}個`);
    
    if (teamsWithoutField.length === 0) {
      return NextResponse.json({
        success: true,
        message: '全チームに既にeditingAllowedフィールドが存在します',
        modifiedCount: 0,
        teamsChecked: allTeams.length
      });
    }
    
    // editingAllowedフィールドを一括追加（デフォルトfalse）
    const result = await Team.updateMany(
      { editingAllowed: { $exists: false } },
      { $set: { editingAllowed: false } }
    );

    console.log(`✅ editingAllowedフィールドを ${result.modifiedCount} 件のチームに追加しました`);
    
    // 更新後の状況を確認
    const updatedTeams = await Team.find({});
    const teamsWithField = updatedTeams.filter(team => team.editingAllowed !== undefined);
    
    return NextResponse.json({
      success: true,
      message: `editingAllowedフィールドを ${result.modifiedCount} 件のチームに追加しました`,
      modifiedCount: result.modifiedCount,
      totalTeams: updatedTeams.length,
      teamsWithEditingAllowed: teamsWithField.length,
      details: updatedTeams.map(team => ({
        id: team.id,
        name: team.name,
        editingAllowed: team.editingAllowed
      }))
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { success: false, error: `マイグレーション失敗: ${error}` },
      { status: 500 }
    );
  }
}