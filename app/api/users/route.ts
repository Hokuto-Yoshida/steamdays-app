// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    console.log('👥 ユーザー一覧取得開始...');
    
    // セッション確認（管理者権限チェック）
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();
    console.log('✅ データベース接続成功');
    
    // 管理者権限確認
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    
    // 全ユーザー取得（パスワードは除く）
    const users = await User.find(
      {},
      { 
        password: 0, // パスワードフィールドを除外
        __v: 0 // バージョンフィールドを除外
      }
    ).sort({ createdAt: -1 }); // 新しい順でソート
    
    console.log(`📊 ユーザー取得成功: ${users.length}件`);
    
    // 統計情報も計算
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        presenter: users.filter(u => u.role === 'presenter').length,
        voter: users.filter(u => u.role === 'voter').length
      }
    };
    
    return NextResponse.json({
      success: true,
      message: `${users.length}人のユーザー情報を取得しました`,
      data: users,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Users fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ユーザー取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('👤 新規ユーザー作成開始...');
    
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
    const { name, email, role, teamId, password = 'steamdays2025' } = body;
    
    // 必須フィールドチェック
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: '名前、メールアドレス、ロールは必須です' },
        { status: 400 }
      );
    }
    
    // メールアドレス重複チェック
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }
    
    // パスワードハッシュ化
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 新規ユーザー作成
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      teamId: role === 'presenter' ? teamId : undefined,
      isActive: true
    });
    
    await newUser.save();
    console.log(`✅ ユーザー作成成功: ${email}`);
    
    // パスワードを除いてレスポンス
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      teamId: newUser.teamId,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };
    
    return NextResponse.json({
      success: true,
      message: 'ユーザーが作成されました',
      data: userResponse
    });
    
  } catch (error) {
    console.error('❌ User creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ユーザー作成中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}