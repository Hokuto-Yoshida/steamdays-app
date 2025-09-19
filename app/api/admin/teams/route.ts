// app/api/admin/teams/route.ts の POST 部分をこれに置き換えてください
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ チーム作成リクエスト受信 (robust insert)');

    const body = await request.json();
    console.log('📋 受信したデータ:', body);

    // 必須フィールド：name（idは任意。なければ生成）
    const { id: clientId, name, title, eventId } = body;
    if (!name) {
      console.log('❌ バリデーションエラー: name 必須');
      return NextResponse.json(
        { success: false, error: 'チーム名(name)は必須です' },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log('🔌 DB接続済み');

    // eventId がないと混合しやすいのでデフォルトを設定（できればクライアントで渡すのが望ましい）
    const safeEventId = eventId || 'default-event';

    // 挿入を試みる関数（リトライ付き）
    const MAX_ATTEMPTS = 5;
    let lastError: any = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // 優先する id はクライアント指定（存在しない or 一意な時のみ採用）
      // ただしクライアント指定が重複している場合はサーバー生成IDにフォールバックする
      const idToUse = attempt === 1 && clientId ? String(clientId) : `team-${randomUUID()}`;

      const teamData = {
        id: idToUse,
        name,
        title: title || `${name}のプロジェクト`,
        eventId: safeEventId,
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

      try {
        console.log(`💾 挿入トライ (attempt ${attempt}) with id=${idToUse}`);
        const team = new Team(teamData);
        const saved = await team.save();
        console.log('✅ チーム作成成功:', saved.id);
        return NextResponse.json({
          success: true,
          data: saved,
          message: `チーム「${saved.name}」を作成しました`,
          generatedId: idToUse,
        }, { status: 201 });
      } catch (err: any) {
        lastError = err;
        // duplicate key (11000) が発生したらリトライ（ただし最初の試行で clientId を使い、その場合は次は生成IDに切り替える）
        const code = err?.code || err?.codeName;
        if (code === 11000 || (err?.message && err.message.includes('E11000'))) {
          console.warn(`⚠️ Duplicate key (attempt ${attempt}) for id=${idToUse}. Retrying...`);
          // 少し待ってから再試行（バックオフ）
          await new Promise(r => setTimeout(r, 100 * attempt));
          continue;
        } else {
          console.error('❌ チーム作成で想定外エラー:', err);
          // それ以外のエラーは即時返す
          if (err instanceof Error) {
            console.error('エラー名:', err.name);
            console.error('エラーメッセージ:', err.message);
            console.error('スタックトレース:', err.stack);
          }
          return NextResponse.json(
            { success: false, error: 'チーム作成中にエラーが発生しました', details: String(err) },
            { status: 500 }
          );
        }
      }
    }

    // 最大リトライを超えた場合はエラー
    console.error('❌ 最大試行回数を超えました:', lastError);
    return NextResponse.json(
      { success: false, error: 'チーム作成に失敗しました（重複が続きました）' },
      { status: 409 }
    );

  } catch (error) {
    console.error('❌ 予期せぬエラー:', error);
    return NextResponse.json(
      { success: false, error: 'チーム作成中に予期せぬエラーが発生しました' },
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

    // 🔧 リクエストボディから teamId を取得するよう修正
    const body = await request.json();
    console.log('📋 削除リクエストボディ:', body);
    
    const { teamId } = body;

    if (!teamId) {
      console.log('❌ チームIDが見つかりません:', { teamId, body });
      return NextResponse.json(
        { success: false, error: 'チームIDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 削除対象チーム:', teamId);
    await dbConnect();

    const deletedTeam = await Team.findOneAndDelete({ id: teamId });
    if (!deletedTeam) {
      console.log('❌ チームが見つかりません:', teamId);
      return NextResponse.json(
        { success: false, error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ チーム削除成功:', teamId, deletedTeam.name);

    return NextResponse.json({
      success: true,
      message: `チーム「${deletedTeam.name}」を削除しました`,
      deletedTeam: {
        id: teamId,
        name: deletedTeam.name
      }
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