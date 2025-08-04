// app/api/admin/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// チーム作成（権限チェック無し）
export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ チーム作成リクエスト受信');
    
    // 権限チェックをコメントアウト（開発・テスト用）
    /*
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    */

    const body = await request.json();
    console.log('📋 受信したデータ:', body);
    
    const { id, name, title } = body;

    // バリデーション
    if (!id || !name) {
      console.log('❌ バリデーションエラー: 必須フィールド不足');
      return NextResponse.json(
        { success: false, error: 'チームIDと名前は必須です' },
        { status: 400 }
      );
    }

    console.log('🔌 データベース接続中...');
    await dbConnect();
    console.log('✅ データベース接続成功');

    // 重複チェック
    console.log('🔍 重複チェック中:', id);
    const existingTeam = await Team.findOne({ id });
    if (existingTeam) {
      console.log('❌ チーム重複:', id);
      return NextResponse.json(
        { success: false, error: `チーム${id}は既に存在します` },
        { status: 400 }
      );
    }
    console.log('✅ 重複チェック完了');

    // チーム作成（必須フィールドに初期値を設定）
    const teamData = {
      id,
      name,
      title: title || `${name}のプロジェクト`,
      description: `${name}のプロジェクト説明（編集してください）`,
      challenge: `${name}が解決したい課題（編集してください）`,
      approach: `${name}のアプローチ（編集してください）`,
      members: [],
      technologies: [],
      scratchUrl: '',
      imageUrl: '',
      hearts: 0,
      comments: [],
      status: 'upcoming'
    };

    console.log('💾 チーム作成中...', teamData);
    const team = new Team(teamData);
    const savedTeam = await team.save();

    console.log('✅ チーム作成成功:', savedTeam.id);

    return NextResponse.json({
      success: true,
      data: savedTeam,
      message: `チーム${savedTeam.name}を作成しました`
    });

  } catch (error) {
    console.error('❌ チーム作成エラー:', error);
    
    // エラーの詳細をログ出力
    if (error instanceof Error) {
      console.error('エラー名:', error.name);
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'チーム作成中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// チーム削除（権限チェック無し）
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ チーム削除リクエスト受信');
    
    // 権限チェックをコメントアウト（開発・テスト用）
    /*
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    */

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'チームIDが必要です' },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedTeam = await Team.findOneAndDelete({ id: teamId });
    if (!deletedTeam) {
      return NextResponse.json(
        { success: false, error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ チーム削除成功:', teamId);

    return NextResponse.json({
      success: true,
      message: `チーム${deletedTeam.name}を削除しました`
    });

  } catch (error) {
    console.error('❌ チーム削除エラー:', error);
    return NextResponse.json(
      { success: false, error: 'チーム削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// テスト用GET
export async function GET() {
  try {
    console.log('🔍 チーム作成API テストエンドポイント');
    
    await dbConnect();
    const teamCount = await Team.countDocuments();
    const teams = await Team.find({}, { id: 1, name: 1, _id: 0 }).limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'チーム作成APIは正常に動作しています',
      currentTeamCount: teamCount,
      sampleTeams: teams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return NextResponse.json(
      { success: false, error: 'APIテストに失敗しました' },
      { status: 500 }
    );
  }
}