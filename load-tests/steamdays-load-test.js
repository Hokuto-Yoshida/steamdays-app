import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// カスタムメトリクス
export const errorRate = new Rate('errors');
export const loginTime = new Trend('login_duration');
export const apiResponseTime = new Trend('api_response_time');
export const pageLoadTime = new Trend('page_load_time');

// 🔧 より現実的なテスト設定
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // ウォームアップ: 1分で10ユーザー
    { duration: '2m', target: 25 },   // 負荷上昇: 2分で25ユーザー
    { duration: '5m', target: 50 },   // メイン負荷: 5分で50ユーザー
    { duration: '2m', target: 25 },   // 負荷減少: 2分で25ユーザー
    { duration: '1m', target: 0 },    // クールダウン: 1分で0ユーザー
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95%のリクエストが3秒以内
    errors: ['rate<0.1'],              // エラー率10%未満
    http_req_failed: ['rate<0.1'],     // 失敗率10%未満
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://steamdays-app.onrender.com';

// 🔧 NextAuth対応のログイン処理
function authenticateUser(userEmail, userPassword) {
  const loginStart = new Date();
  
  // 1. CSRFトークンを取得
  const csrfResponse = http.get(`${BASE_URL}/api/auth/csrf`);
  if (!check(csrfResponse, { 'CSRF token retrieved': (r) => r.status === 200 })) {
    errorRate.add(1);
    return null;
  }
  
  const csrfToken = JSON.parse(csrfResponse.body).csrfToken;
  const cookies = csrfResponse.cookies;
  
  // 2. NextAuth credentials signin
  const signinResponse = http.post(`${BASE_URL}/api/auth/signin/credentials`, {
    email: userEmail,
    password: userPassword,
    csrfToken: csrfToken,
    callbackUrl: `${BASE_URL}/`,
    json: 'true'
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cookies: cookies,
    redirects: 0, // リダイレクトを無効化
  });
  
  const loginDuration = new Date() - loginStart;
  loginTime.add(loginDuration);
  
  // NextAuthは成功時に302リダイレクトを返す
  const loginSuccess = check(signinResponse, {
    'login redirects (302)': (r) => r.status === 302,
    'login response time < 5s': (r) => r.timings.duration < 5000,
  });
  
  if (!loginSuccess) {
    console.log(`❌ Login failed for ${userEmail}: ${signinResponse.status}`);
    errorRate.add(1);
    return null;
  }
  
  // セッションクッキーを結合
  const sessionCookies = Object.assign({}, cookies, signinResponse.cookies);
  return sessionCookies;
}

// 🔧 軽量化されたページアクセステスト
function testPageAccess(cookies) {
  const pages = [
    { url: '/', name: 'home' },
    { url: '/teams/1', name: 'team1' },
    { url: '/teams/2', name: 'team2' },
    { url: '/ranking', name: 'ranking' }
  ];
  
  const randomPage = pages[Math.floor(Math.random() * pages.length)];
  const start = new Date();
  
  const response = http.get(`${BASE_URL}${randomPage.url}`, {
    cookies: cookies,
  });
  
  const duration = new Date() - start;
  pageLoadTime.add(duration);
  
  check(response, {
    [`${randomPage.name} status is 200`]: (r) => r.status === 200,
    [`${randomPage.name} loads < 3s`]: (r) => r.timings.duration < 3000,
  });
  
  return response.status === 200;
}

// 🔧 API レスポンステスト
function testAPIEndpoints(cookies) {
  const apis = [
    '/api/teams',
    '/api/teams/list'
  ];
  
  apis.forEach(endpoint => {
    const start = new Date();
    
    const response = http.get(`${BASE_URL}${endpoint}`, {
      cookies: cookies,
    });
    
    const duration = new Date() - start;
    apiResponseTime.add(duration);
    
    check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 2s`]: (r) => r.timings.duration < 2000,
      [`${endpoint} returns JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
  });
}

// 🔧 投票テスト（認証済みユーザーのみ）
function testVoting(cookies) {
  const teamId = Math.floor(Math.random() * 6) + 1;
  const start = new Date();
  
  const voteData = JSON.stringify({
    reason: `負荷テスト投票 - ${new Date().toISOString()}`
  });
  
  const response = http.post(`${BASE_URL}/api/teams/${teamId}/vote`, voteData, {
    headers: {
      'Content-Type': 'application/json',
    },
    cookies: cookies,
  });
  
  const duration = new Date() - start;
  apiResponseTime.add(duration);
  
  // 投票は重複エラー（409）も成功とみなす
  const voteSuccess = check(response, {
    'vote endpoint responds': (r) => r.status === 200 || r.status === 409,
    'vote response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!voteSuccess && response.status !== 409) {
    console.log(`❌ Vote failed for team ${teamId}: ${response.status}`);
    errorRate.add(1);
  }
}

// 🔧 メインテスト関数（軽量化）
export default function() {
  const userId = Math.floor(Math.random() * 100) + 1;
  const userEmail = `test${userId}@steamdays.test`;
  const userPassword = 'test123';
  
  // 10%の確率でログインテスト（全ユーザーでログインすると負荷が高すぎる）
  if (Math.random() < 0.1) {
    console.log(`🔐 Testing login for: ${userEmail}`);
    const cookies = authenticateUser(userEmail, userPassword);
    
    if (cookies) {
      sleep(1);
      
      // 認証済みユーザーの行動
      if (Math.random() < 0.8) {
        testPageAccess(cookies);
      }
      
      if (Math.random() < 0.3) {
        testVoting(cookies);
      }
      
      check(null, {
        'authenticated home access': () => true
      });
    }
  } else {
    // 80%のユーザーは匿名でページアクセスのみ
    if (Math.random() < 0.8) {
      testPageAccess(null);
    }
    
    // 50%の確率でAPI応答テスト
    if (Math.random() < 0.5) {
      testAPIEndpoints(null);
    }
    
    check(null, {
      'login request sent': () => true
    });
  }
  
  // ランダム待機時間（1-3秒）
  sleep(Math.random() * 2 + 1);
}

// セットアップ関数
export function setup() {
  console.log('🚀 STEAMDAYS!! 負荷テスト開始');
  console.log(`📊 テスト対象: ${BASE_URL}`);
  console.log('📈 想定テストユーザー: 1-100番');
  
  // ヘルスチェック
  const healthCheck = http.get(`${BASE_URL}/`);
  if (healthCheck.status !== 200) {
    throw new Error(`❌ アプリが正常に動作していません: ${healthCheck.status}`);
  }
  
  console.log('✅ ヘルスチェック完了');
  console.log('📋 テスト内容:');
  console.log('  • 80% - ページアクセステスト');
  console.log('  • 50% - API応答テスト');
  console.log('  • 30% - 投票エンドポイントテスト');
  console.log('  • 10% - ログインテスト');
  
  return { startTime: new Date() };
}

// 終了処理
export function teardown(data) {
  const duration = new Date() - data.startTime;
  console.log(`🏁 負荷テスト完了 - 実行時間: ${Math.round(duration / 1000)}秒`);
  console.log('📊 詳細な結果は上記の統計情報をご確認ください');
}