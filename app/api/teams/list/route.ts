// app/api/teams/list/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// 登録用のチーム一覧取得（簡易版）
export async function GET() {
  try {
    console.log('📋 チーム一覧取得リクエスト');
    
    await dbConnect();
    
    // チーム一覧をIDとnameのみ取得
    const teams = await Team.find({}, { id: 1, name: 1, _id: 0 }).sort({ id: 1 });
    
    console.log('✅ チーム一覧取得成功:', teams.length, '個');
    
    return NextResponse.json({
      success: true,
      data: teams,
      message: `${teams.length}個のチームを取得しました`
    });

  } catch (error) {
    console.error('❌ チーム一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'チーム一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}