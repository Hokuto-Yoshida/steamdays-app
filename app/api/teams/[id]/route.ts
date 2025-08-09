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

    await dbConnect();
    
    // チーム情報を取得（editingAllowed フラグをチェックするため）
    const team = await Team.findOne({ id });
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // 🆕 新しい権限チェック: 管理者または（発表者 + 編集許可ON）
    const canEdit = session.user.role === 'admin' || 
                   (session.user.role === 'presenter' && 
                    session.user.teamId === id && 
                    team.editingAllowed === true);
    
    if (!canEdit) {
      const reason = session.user.role === 'presenter' && session.user.teamId === id
        ? '編集権限が無効になっています。管理者に編集許可を依頼してください。'
        : '編集権限がありません';
        
      return NextResponse.json(
        { success: false, error: reason },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📝 チーム更新データ受信:', { 
      ...body, 
      imageUrl: body.imageUrl ? `[${body.imageUrl.length} chars]` : 'なし' 
    });
    
    // 更新可能なフィールドのみを抽出（editingAllowedは含めない - APIで別管理）
    const updateData = {
      name: body.name,
      title: body.title,
      description: body.description,
      challenge: body.challenge,
      approach: body.approach,
      members: body.members || [],
      technologies: body.technologies || [],
      scratchUrl: body.scratchUrl || '',
      imageUrl: body.imageUrl || '',
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

    console.log('✅ チーム更新成功:', {
      id: updatedTeam.id,
      name: updatedTeam.name,
      hasImage: !!updatedTeam.imageUrl,
      editingAllowed: updatedTeam.editingAllowed
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