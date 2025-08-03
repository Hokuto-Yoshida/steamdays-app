import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Team } from '@/lib/models/Team';

// CORSヘッダーを追加
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONSリクエストのハンドリング
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/register - リクエスト受信');
  
  try {
    console.log('📝 新規登録リクエスト処理開始');
    
    const body = await request.json();
    console.log('📋 リクエストデータ:', { ...body, password: '***' });
    
    const { email, password, name, role, teamId } = body;

    // バリデーション
    if (!email || !password || !name || !role) {
      console.log('❌ バリデーションエラー: 必須フィールド不足');
      return NextResponse.json(
        { success: false, error: 'すべての必須フィールドを入力してください' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 6) {
      console.log('❌ バリデーションエラー: パスワードが短すぎます');
      return NextResponse.json(
        { success: false, error: 'パスワードは6文字以上で入力してください' },
        { status: 400, headers: corsHeaders }
      );
    }

    // プレゼンターの場合はチームIDが必要
    if (role === 'presenter' && !teamId) {
      console.log('❌ バリデーションエラー: プレゼンターにチームID必須');
      return NextResponse.json(
        { success: false, error: 'プレゼンターにはチームIDが必要です' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🔌 データベース接続中...');
    await dbConnect();
    console.log('✅ データベース接続成功');

    // チームIDの存在確認（プレゼンターの場合）
    if (role === 'presenter') {
      console.log('🏷️ チームID確認中:', teamId);
      const team = await Team.findOne({ id: teamId });
      if (!team) {
        console.log('❌ チームが見つかりません:', teamId);
        return NextResponse.json(
          { success: false, error: '指定されたチームが見つかりません' },
          { status: 400, headers: corsHeaders }
        );
      }
      console.log('✅ チーム確認完了:', team.name);
    }

    // 既存ユーザーの確認
    console.log('👤 既存ユーザー確認中:', email.toLowerCase());
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ ユーザー既存:', email);
      return NextResponse.json(
        { success: false, error: 'このメールアドレスは既に登録されています' },
        { status: 400, headers: corsHeaders }
      );
    }
    console.log('✅ ユーザー重複なし');

    // パスワードをハッシュ化
    console.log('🔐 パスワードハッシュ化中...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ パスワードハッシュ化完了');

    // ユーザーを作成
    console.log('💾 ユーザー作成中...');
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      teamId: role === 'presenter' ? teamId : undefined,
      isActive: true
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    console.log('✅ ユーザー作成成功:', savedUser._id);

    // パスワードを除いてレスポンス
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'ユーザーが正常に作成されました'
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ 登録処理エラー:', error);
    
    // MongoDBエラーの詳細ログ
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'ユーザー作成中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
}

// GETメソッドも追加（テスト用）
export async function GET() {
  console.log('🔍 GET /api/register - テストエンドポイント');
  return NextResponse.json(
    { 
      message: 'Register API is working',
      timestamp: new Date().toISOString(),
      methods: ['POST']
    },
    { 
      status: 200, 
      headers: corsHeaders 
    }
  );
}