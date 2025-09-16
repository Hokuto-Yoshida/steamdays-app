import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 チーム順序更新リクエスト受信');

    // 権限チェックをコメントアウト（開発・テスト用）
    /*
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }
    */

    const body = await request.json();
    console.log('📋 順序更新データ:', body);

    const { order } = body;

    if (!order || !Array.isArray(order)) {
      console.log('❌ バリデーションエラー: order必須');
      return NextResponse.json(
        { success: false, error: 'Invalid order data format' },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log('🔌 DB接続済み');
    
    // バルク更新でチーム順序を更新
    const bulkOps = order.map((item: { id: string; sortOrder: number }) => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: { sortOrder: item.sortOrder } }
      }
    }));

    console.log('💾 バルク更新実行中...');
    const result = await Team.bulkWrite(bulkOps);
    console.log('✅ バルク更新完了:', result.modifiedCount);

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount}チームの順序を更新しました`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ チーム順序更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'チーム順序更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// テスト用GET
export async function GET() {
  try {
    console.log('🔍 チーム順序API テストエンドポイント');
    
    await dbConnect();
    const teams = await Team.find({}, { id: 1, name: 1, sortOrder: 1, _id: 0 })
                           .sort({ sortOrder: 1 })
                           .limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'チーム順序APIは正常に動作しています',
      teams: teams,
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