// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// ユーザー情報更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('✏️ ユーザー情報更新開始...');
    
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    // セッション確認
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // 管理者権限確認
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, email, role, teamId, isActive, newPassword } = body;
    
    // 更新対象ユーザー確認
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // 更新データ準備
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email && email !== targetUser.email) {
      // メール重複チェック
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }
      updateData.email = email.toLowerCase();
    }
    if (role) {
      updateData.role = role;
      if (role === 'presenter' && teamId) {
        updateData.teamId = teamId;
      } else if (role !== 'presenter') {
        updateData.teamId = undefined;
      }
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    // パスワード更新（指定された場合）
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }
    
    updateData.updatedAt = new Date();
    
    // ユーザー更新
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password -__v' }
    );
    
    console.log(`✅ ユーザー更新成功: ${updatedUser.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'ユーザー情報が更新されました',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('❌ User update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ユーザー更新中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// ユーザー削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ ユーザー削除開始...');
    
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    // セッション確認
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // 管理者権限確認
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    // 削除対象ユーザー確認
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // 自分自身の削除を防ぐ
    if (targetUser.email === currentUser.email) {
      return NextResponse.json(
        { success: false, error: '自分自身は削除できません' },
        { status: 400 }
      );
    }
    
    // ユーザー削除
    await User.findByIdAndDelete(userId);
    console.log(`✅ ユーザー削除成功: ${targetUser.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'ユーザーが削除されました',
      deletedUser: {
        name: targetUser.name,
        email: targetUser.email
      }
    });
    
  } catch (error) {
    console.error('❌ User deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ユーザー削除中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}