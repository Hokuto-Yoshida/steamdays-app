# STEAMDAYS!! 負荷テスト実行スクリプト (Windows PowerShell)

Write-Host "🚀 STEAMDAYS!! 負荷テスト実行スクリプト" -ForegroundColor Green

# 設定
$BASE_URL = "https://steamdays-app.onrender.com"
$RESULTS_DIR = "results"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# 結果保存ディレクトリ作成
if (!(Test-Path $RESULTS_DIR)) {
    New-Item -ItemType Directory -Path $RESULTS_DIR | Out-Null
}

Write-Host "📊 テスト環境: $BASE_URL" -ForegroundColor Cyan
Write-Host "📁 結果保存先: $RESULTS_DIR" -ForegroundColor Cyan

# 1. テストユーザー作成
Write-Host ""
Write-Host "👥 ステップ1: テストユーザー作成" -ForegroundColor Yellow

$body = @{
    count = 100
    type = "mixed"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/admin/create-test-users" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ テストユーザー作成完了: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ テストユーザー作成に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 5

# 2. 負荷テスト実行
Write-Host ""
Write-Host "🔥 ステップ2: 負荷テスト実行" -ForegroundColor Yellow
Write-Host "📈 最大100同時ユーザー、24分間のテスト" -ForegroundColor Cyan

$env:BASE_URL = $BASE_URL

try {
    k6 run --out "json=$RESULTS_DIR/results_$TIMESTAMP.json" --out "csv=$RESULTS_DIR/results_$TIMESTAMP.csv" --env BASE_URL=$BASE_URL steamdays-load-test.js
    Write-Host "✅ 負荷テスト完了" -ForegroundColor Green
} catch {
    Write-Host "❌ 負荷テスト実行に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 結果解析
Write-Host ""
Write-Host "📊 ステップ3: 結果解析" -ForegroundColor Yellow

$resultsFile = "$RESULTS_DIR/results_$TIMESTAMP.json"
if (Test-Path $resultsFile) {
    Write-Host "📈 主要パフォーマンス指標:" -ForegroundColor Cyan
    
    # JSONファイルから結果を読み取り（簡易版）
    $jsonContent = Get-Content $resultsFile -Raw | ConvertFrom-Json
    if ($jsonContent.metrics) {
        Write-Host "🕒 レスポンス時間情報: 詳細はJSONファイルを確認してください" -ForegroundColor White
        Write-Host "📡 結果ファイル: $resultsFile" -ForegroundColor White
    }
} else {
    Write-Host "⚠️ 結果ファイルが見つかりません" -ForegroundColor Yellow
}

# 4. テストユーザー削除（オプション）
Write-Host ""
Write-Host "🗑️ ステップ4: テストユーザー削除" -ForegroundColor Yellow

$deleteChoice = Read-Host "テストユーザーを削除しますか? (y/N)"
if ($deleteChoice -eq "y" -or $deleteChoice -eq "Y") {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/admin/create-test-users" -Method DELETE
        Write-Host "✅ テストユーザー削除完了: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "❌ テストユーザー削除に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ テストユーザーは保持されます" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 負荷テスト完了!" -ForegroundColor Green
Write-Host "📁 結果ファイル: $RESULTS_DIR/results_$TIMESTAMP.*" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 結果の見方:" -ForegroundColor Cyan
Write-Host "  • http_req_duration: リクエスト応答時間" -ForegroundColor White
Write-Host "  • http_req_failed: 失敗率" -ForegroundColor White
Write-Host "  • errors: カスタムエラー率" -ForegroundColor White
Write-Host "  • login_duration: ログイン時間" -ForegroundColor White
Write-Host "  • api_response_time: API応答時間" -ForegroundColor White