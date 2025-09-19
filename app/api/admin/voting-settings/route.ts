// app/api/admin/voting-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import VotingSettings from '@/lib/models/VotingSettings';

// 投票設定取得
export async function GET() {
  try {
    await dbConnect();
    
    let settings = await VotingSettings.findOne();
    
    // 設定が存在しない場合は初期化
    if (!settings) {
      settings = new VotingSettings({
        isVotingOpen: true,
        openedAt: new Date()
      });
      await settings.save();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        isVotingOpen: settings.isVotingOpen,
        openedAt: settings.openedAt,
        closedAt: settings.closedAt
      }
    });
  } catch (error) {
    console.error('投票設定取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: '投票設定の取得に失敗しました'
    }, { status: 500 });
  }
}

// 投票設定更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: '管理者権限が必要です'
      }, { status: 403 });
    }
    
    const { isVotingOpen } = await request.json();
    
    await dbConnect();
    
    let settings = await VotingSettings.findOne();
    
    if (!settings) {
      settings = new VotingSettings({
        isVotingOpen: true,
        openedAt: new Date()
      });
    }
    
    settings.isVotingOpen = isVotingOpen;
    
    if (isVotingOpen) {
      settings.openedAt = new Date();
      settings.closedAt = undefined;
    } else {
      settings.closedAt = new Date();
    }
    
    await settings.save();
    
    return NextResponse.json({
      success: true,
      message: `投票を${isVotingOpen ? '再開' : '締め切り'}ました`,
      data: {
        isVotingOpen: settings.isVotingOpen,
        openedAt: settings.openedAt,
        closedAt: settings.closedAt
      }
    });
    
  } catch (error) {
    console.error('投票設定更新エラー:', error);
    return NextResponse.json({
      success: false,
      error: '投票設定の更新に失敗しました'
    }, { status: 500 });
  }
}