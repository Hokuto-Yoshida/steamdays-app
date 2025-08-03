import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 既存の管理者をチェック
    const existingAdmin = await User.findOne({ 
      email: 'admin@steamdays.com' 
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: '管理者アカウントは既に存在します',
        data: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 管理者アカウントを作成
    const adminUser = new User({
      email: 'admin@steamdays.com',
      password: hashedPassword,
      name: '管理者',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: '管理者アカウントが作成されました',
      data: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json({
      success: false,
      error: '管理者アカウントの作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 安全のため、GET リクエストでも作成できるようにする（開発時のみ）
export async function GET(request: NextRequest) {
  return POST(request);
}