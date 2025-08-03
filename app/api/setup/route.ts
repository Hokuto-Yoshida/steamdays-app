import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/lib/models/Team';

const initialTeams = [
  {
    id: "1",
    name: "チーム コネクト",
    title: "みんなでつながる感情シェアアプリ",
    description: "感情を色や音で表現し、言葉では伝えにくい気持ちを共有できるコミュニケーションツール",
    challenge: "感情の表現が苦手な人も、自分らしく気持ちを伝えられる方法を提供したい",
    approach: "視覚的・聴覚的な表現方法を組み合わせて、多様なコミュニケーションスタイルに対応",
    members: ["田中 あすか", "佐藤 けんと", "山田 みお"],
    technologies: ["Scratch", "JavaScript", "Web Audio API"],
    scratchUrl: "https://scratch.mit.edu/projects/123456789/embed",
    hearts: 15,
    comments: [
      {
        reason: "色で感情を表現するアイデアが素晴らしい！",
        timestamp: new Date("2025-08-01T10:30:00"),
        author: "匿名ユーザー"
      }
    ]
  },
  {
    id: "2",
    name: "チーム ハーモニー",
    title: "みんなちがって、みんないい - 特性マッチングサービス",
    description: "個人の特性や興味に基づいて、相性の良いコミュニティや活動を提案するマッチングアプリ",
    challenge: "自分の特性を活かせる場所や人とのつながりを見つけるのが難しい問題を解決",
    approach: "特性診断と興味分析を組み合わせ、最適なマッチングを提供するアルゴリズムを開発",
    members: ["鈴木 りな", "高橋 だいき", "伊藤 ゆか"],
    technologies: ["Scratch", "Python", "Machine Learning"],
    hearts: 23,
    comments: []
  },
  {
    id: "3",
    name: "チーム エンパワー",
    title: "スモールステップ達成アプリ",
    description: "大きな目標を小さなステップに分解し、達成感を積み重ねながら成長をサポートするアプリ",
    challenge: "大きな課題に圧倒されがちな人が、着実に前進できるようサポートしたい",
    approach: "ゲーミフィケーション要素と視覚的な進捗表示で、モチベーション維持をサポート",
    members: ["渡辺 そうた", "中村 あかり", "小林 ひろき"],
    technologies: ["Scratch", "React", "Local Storage"],
    hearts: 18,
    comments: []
  },
  {
    id: "4",
    name: "チーム サポート",
    title: "安心コミュニケーション環境",
    description: "ネガティブな発言を自動検出し、ポジティブな表現に変換提案する安全なチャットアプリ",
    challenge: "オンラインコミュニケーションでの誤解や傷つきを防ぎ、安心して交流できる場を作りたい",
    approach: "AIを活用した文章解析と、建設的なコミュニケーションを促進するUIデザイン",
    members: ["松本 なな", "木村 としき", "斎藤 まい"],
    technologies: ["Scratch", "Natural Language Processing", "AI"],
    hearts: 31,
    comments: []
  },
  {
    id: "5",
    name: "チーム クリエイト",
    title: "表現の自由空間 - マルチメディア創作アプリ",
    description: "絵、音楽、文章など様々な表現方法を組み合わせて、自分だけの作品を作れるクリエイティブツール",
    challenge: "言語的表現が苦手でも、多様な方法で自分の想いを表現できる場を提供したい",
    approach: "直感的なUI/UXで、誰でも簡単にマルチメディア作品を制作できる環境を実現",
    members: ["藤田 こうき", "岡田 れい", "森 たくみ"],
    technologies: ["Scratch", "Canvas API", "Web Audio"],
    hearts: 27,
    comments: []
  },
  {
    id: "6",
    name: "チーム ブリッジ",
    title: "理解の架け橋 - 障害理解促進アプリ",
    description: "体験型コンテンツを通じて、精神発達障害への理解を深めることができる教育アプリ",
    challenge: "社会全体の理解不足を解決し、インクルーシブな環境作りを促進したい",
    approach: "ゲーム形式の体験学習と、当事者の声を届けるストーリーテリング機能を組み合わせ",
    members: ["加藤 みさき", "山口 りょう", "吉田 えみ"],
    technologies: ["Scratch", "Interactive Media", "Storytelling"],
    hearts: 41,
    comments: []
  }
];

export async function POST() {
  try {
    await dbConnect();
    
    // 既存のデータを削除
    await Team.deleteMany({});
    
    // 初期データを挿入
    await Team.insertMany(initialTeams);
    
    return NextResponse.json({
      success: true,
      message: `${initialTeams.length} teams initialized successfully`
    });
    
  } catch (error) {
    console.error('Setup API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize data' },
      { status: 500 }
    );
  }
}