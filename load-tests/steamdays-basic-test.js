import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// シンプルなメトリクス
export const homePageTime = new Trend('home_page_duration');
export const teamPageTime = new Trend('team_page_duration');
export const apiTime = new Trend('api_duration');

// 🎯 シンプルな負荷テスト設定
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // 1分で20人
    { duration: '3m', target: 50 },   // 3分で50人  
    { duration: '5m', target: 100 },  // 5分で100人（ピーク）
    { duration: '3m', target: 50 },   // 3分で50人に戻す
    { duration: '1m', target: 0 },    // 1分で0人
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%のリクエストが2秒以内
    http_req_failed: ['rate<0.05'],    // 失敗率5%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://steamdays-app.onrender.com';

export default function() {
  // 🎯 実際のユーザー行動をシミュレート
  
  // 1. ホームページアクセス（100%のユーザー）
  const homeStart = Date.now();
  const homeResponse = http.get(`${BASE_URL}/`);
  homePageTime.add(Date.now() - homeStart);
  
  check(homeResponse, {
    'ホームページが正常に表示': (r) => r.status === 200,
    'ホームページが2秒以内': (r) => r.timings.duration < 2000,
    'STEAMDAYS!!という文字が含まれる': (r) => r.body.includes('STEAMDAYS!!'),
  });
  
  // 少し待つ（実際のユーザーがページを見る時間）
  sleep(1 + Math.random() * 2); // 1-3秒のランダム
  
  // 2. チーム詳細ページアクセス（70%のユーザー）
  if (Math.random() < 0.7) {
    const teamId = Math.floor(Math.random() * 6) + 1; // 1-6のランダム
    
    const teamStart = Date.now();
    const teamResponse = http.get(`${BASE_URL}/teams/${teamId}`);
    teamPageTime.add(Date.now() - teamStart);
    
    check(teamResponse, {
      'チーム詳細ページが正常に表示': (r) => r.status === 200,
      'チーム詳細ページが2秒以内': (r) => r.timings.duration < 2000,
      'チーム名が含まれる': (r) => r.body.includes('チーム'),
    });
    
    sleep(2 + Math.random() * 3); // チーム詳細を見る時間
  }
  
  // 3. ランキングページアクセス（40%のユーザー）
  if (Math.random() < 0.4) {
    const rankingStart = Date.now();
    const rankingResponse = http.get(`${BASE_URL}/ranking`);
    
    check(rankingResponse, {
      'ランキングページが正常に表示': (r) => r.status === 200,
      'ランキングページが2秒以内': (r) => r.timings.duration < 2000,
    });
    
    sleep(1 + Math.random() * 2);
  }
  
  // 4. APIアクセス（20%のユーザー）
  if (Math.random() < 0.2) {
    const apiStart = Date.now();
    const apiResponse = http.get(`${BASE_URL}/api/teams`);
    apiTime.add(Date.now() - apiStart);
    
    check(apiResponse, {
      'API が正常に応答': (r) => r.status === 200,
      'API が1秒以内に応答': (r) => r.timings.duration < 1000,
      'JSON形式で応答': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
  }
  
  // 実際のユーザーがサイトを見る間隔
  sleep(1 + Math.random() * 4); // 1-5秒のランダム
}

export function setup() {
  console.log('🚀 STEAMDAYS!! シンプル負荷テスト開始');
  console.log(`📊 テスト対象: ${BASE_URL}`);
  console.log('👥 最大100人の同時アクセスをシミュレート');
  console.log('📋 テスト内容:');
  console.log('  • 100% - ホームページアクセス');
  console.log('  •  70% - チーム詳細ページアクセス');
  console.log('  •  40% - ランキングページアクセス');
  console.log('  •  20% - API呼び出し');
  
  // ヘルスチェック
  const healthCheck = http.get(`${BASE_URL}/`);
  if (healthCheck.status !== 200) {
    throw new Error(`❌ サイトにアクセスできません: ${healthCheck.status}`);
  }
  
  console.log('✅ サイト確認完了、テスト開始');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = Math.round((Date.now() - data.startTime) / 1000);
  console.log(`🏁 テスト完了 - 実行時間: ${duration}秒`);
  console.log('📊 結果サマリー:');
  console.log('  • http_req_duration: 全体のレスポンス時間');
  console.log('  • home_page_duration: ホームページの表示時間');
  console.log('  • team_page_duration: チーム詳細ページの表示時間'); 
  console.log('  • api_duration: API応答時間');
}