import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// 既存のGETメソッド（そのまま維持）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const team = await Team.findOne({ id: params.id });
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: team 
    });
  } catch (error) {
    console.error('Team detail API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// チーム情報更新のためのPUTメソッドを追加
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 権限チェック: 管理者または該当チームの発表者のみ
    const canEdit = session.user.role === 'admin' || 
                   (session.user.role === 'presenter' && session.user.teamId === params.id);
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // 更新可能なフィールドのみを抽出
    const updateData = {
      name: body.name,
      title: body.title,
      description: body.description,
      challenge: body.challenge,
      approach: body.approach,
      members: body.members || [],
      technologies: body.technologies || [],
      scratchUrl: body.scratchUrl,
      updatedAt: new Date()
    };

    // バリデーション
    if (!updateData.name || !updateData.title || !updateData.description) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { id: params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });

  } catch (error) {
    console.error('Team update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// 既存の投票機能（/vote エンドポイント）も必要に応じて保持