import http from 'k6/http';
import { check, sleep } from 'k6';

// 基本設定（まずは軽いテスト）
export const options = {
  vus: 5,        // 5人の仮想ユーザー
  duration: '30s', // 30秒間実行
};

// テスト対象URL
const BASE_URL = 'https://steamdays-app.onrender.com';

export default function() {
  console.log('🔄 基本テスト実行中...');
  
  // 1. ホームページアクセス
  const response = http.get(BASE_URL);
  
  // 2. レスポンスチェック
  const result = check(response, {
    'ホームページが正常に表示される': (r) => r.status === 200,
    'レスポンス時間が3秒以内': (r) => r.timings.duration < 3000,
    'STEAM DAYSの文字が含まれる': (r) => r.body.includes('STEAM DAYS'),
  });
  
  if (result) {
    console.log('✅ 基本テスト成功');
  } else {
    console.log('❌ 基本テスト失敗');
  }
  
  // 3. 1-3秒待機
  sleep(Math.random() * 2 + 1);
}

export function setup() {
  console.log('🚀 K6基本テスト開始');
  console.log(`📊 テスト対象: ${BASE_URL}`);
}

export function teardown() {
  console.log('🏁 K6基本テスト完了');
}