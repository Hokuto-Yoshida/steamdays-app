// app/api/admin/voting-settings/route.ts (テスト版)
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('GET request received');
  return NextResponse.json({
    success: true,
    data: {
      isVotingOpen: true,
      openedAt: new Date(),
      closedAt: null
    }
  });
}

export async function PUT(request: NextRequest) {
  console.log('PUT request received');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: `投票を${body.isVotingOpen ? '再開' : '締め切り'}ました`,
      data: {
        isVotingOpen: body.isVotingOpen,
        openedAt: new Date(),
        closedAt: body.isVotingOpen ? null : new Date()
      }
    });
    
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました'
    }, { status: 500 });
  }
}