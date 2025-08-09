import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// POST メソッド - テストユーザー一括作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者権限チェック
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { count = 100, type = 'mixed' } = body;
    
    console.log(`🏗️ ${count}人のテストユーザーを作成開始...`);
    
    const users = [];
    const batchSize = 10; // バッチサイズ
    let created = 0;
    
    // パスワードを事前にハッシュ化（共通パスワード）
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    for (let i = 1; i <= count; i++) {
      // ロール分散（投票者80%, 発表者20%）
      const role = type === 'voters' ? 'voter' : 
                  type === 'presenters' ? 'presenter' :
                  i <= count * 0.2 ? 'presenter' : 'voter';
      
      // チームID（発表者の場合）
      const teamId = role === 'presenter' ? String(((i - 1) % 6) + 1) : undefined;
      
      const userData = {
        email: `test${i}@steamdays.test`,
        password: hashedPassword,
        name: `テストユーザー${i}`,
        role,
        teamId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      users.push(userData);
      
      // バッチ処理
      if (users.length >= batchSize || i === count) {
        try {
          await User.insertMany(users, { ordered: false });
          created += users.length;
          console.log(`📊 進行状況: ${created}/${count} ユーザー作成完了`);
        } catch (error: any) {
          // 重複エラーを無視
          if (error.code === 11000) {
            console.log(`⚠️ 重複ユーザーをスキップ: ${error.writeErrors?.length || 0}件`);
            created += users.length - (error.writeErrors?.length || 0);
          } else {
            throw error;
          }
        }
        users.length = 0; // 配列をクリア
      }
    }

    console.log(`✅ テストユーザー作成完了: ${created}/${count}人`);

    return NextResponse.json({
      success: true,
      message: `${created}人のテストユーザーを作成しました`,
      created,
      requested: count,
      skipped: count - created
    });

  } catch (error) {
    console.error('❌ Test user creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test users' },
      { status: 500 }
    );
  }
}

// DELETE メソッド - テストユーザー一括削除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // test@steamdays.test ドメインのユーザーを削除
    const result = await User.deleteMany({
      email: { $regex: '@steamdays\\.test$' }
    });

    console.log(`🗑️ テストユーザー削除完了: ${result.deletedCount}人`);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount}人のテストユーザーを削除しました`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Test user deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete test users' },
      { status: 500 }
    );
  }
}