import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User, UserRole } from '@/lib/models/User';

const demoUsers = [
  {
    email: 'admin@steamdays.com',
    password: 'password123',
    name: '管理者',
    role: UserRole.ADMIN
  },
  {
    email: 'team1@steamdays.com',
    password: 'password123',
    name: 'チーム1代表',
    role: UserRole.PRESENTER,
    teamId: '1'
  },
  {
    email: 'team2@steamdays.com',
    password: 'password123',
    name: 'チーム2代表',
    role: UserRole.PRESENTER,
    teamId: '2'
  },
  {
    email: 'voter@steamdays.com',
    password: 'password123',
    name: '投票者',
    role: UserRole.VOTER
  },
  {
    email: 'viewer@steamdays.com',
    password: 'password123',
    name: '観覧者',
    role: UserRole.VOTER
  }
];

export async function POST() {
  try {
    console.log('🔧 デモユーザーセットアップ開始...');
    
    await dbConnect();
    console.log('✅ データベース接続成功');
    
    // 既存のデモユーザーを削除
    const deleteResult = await User.deleteMany({
      email: { $in: demoUsers.map(user => user.email) }
    });
    console.log(`🗑️ 既存ユーザー削除: ${deleteResult.deletedCount}件`);
    
    // デモユーザーを作成
    const hashedUsers = [];
    
    for (const user of demoUsers) {
      console.log(`🔐 パスワードハッシュ化中: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      hashedUsers.push({
        ...user,
        email: user.email.toLowerCase(),
        password: hashedPassword,
        isActive: true
      });
    }
    
    console.log('💾 ユーザー一括作成中...');
    const insertResult = await User.insertMany(hashedUsers);
    console.log(`✅ ユーザー作成成功: ${insertResult.length}件`);
    
    // 作成されたユーザーを確認
    const createdUsers = await User.find(
      { email: { $in: demoUsers.map(user => user.email) } },
      { password: 0 } // パスワードは除く
    );
    
    return NextResponse.json({
      success: true,
      message: `${demoUsers.length}人のデモユーザーが作成されました`,
      users: createdUsers,
      debug: {
        deletedCount: deleteResult.deletedCount,
        insertedCount: insertResult.length,
        verificationCount: createdUsers.length
      }
    });
    
  } catch (error) {
    console.error('❌ Setup users error:', error);
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