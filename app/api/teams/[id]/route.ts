import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; 
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

// GET メソッド - Next.js 15対応
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    await dbConnect();
    const team = await Team.findOne({ id });
    
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

// PUT メソッド - Next.js 15対応
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 権限チェック: 管理者または該当チームの発表者のみ
    const canEdit = session.user.role === 'admin' || 
                   (session.user.role === 'presenter' && session.user.teamId === id);
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    console.log('📝 チーム更新データ受信:', { 
      ...body, 
      imageUrl: body.imageUrl ? `[${body.imageUrl.length} chars]` : 'なし' 
    });
    
    // 更新可能なフィールドのみを抽出（imageUrl追加）
    const updateData = {
      name: body.name,
      title: body.title,
      description: body.description,
      challenge: body.challenge,
      approach: body.approach,
      members: body.members || [],
      technologies: body.technologies || [],
      scratchUrl: body.scratchUrl || '',
      imageUrl: body.imageUrl || '', // 🖼️ 画像URL追加
      updatedAt: new Date()
    };

    console.log('💾 更新データ:', { 
      ...updateData, 
      imageUrl: updateData.imageUrl ? `[${updateData.imageUrl.length} chars]` : 'なし' 
    });

    // バリデーション
    if (!updateData.name || !updateData.title || !updateData.description) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    console.log('✅ チーム更新成功:', {
      id: updatedTeam.id,
      name: updatedTeam.name,
      hasImage: !!updatedTeam.imageUrl
    });

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });

  } catch (error) {
    console.error('❌ Team update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}