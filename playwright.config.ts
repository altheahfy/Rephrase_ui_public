import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // タイムアウト設定
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
    // Visual Regression の閾値（5%の差分まで許容）
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.05,
    },
  },

  // 並列実行の設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // 全テストで共通の設定
  use: {
    // ベースURL（Live Server使用時）
    baseURL: 'http://127.0.0.1:5500',
    
    // トレース記録（失敗時のみ）
    trace: 'retain-on-failure',
    
    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',
    
    // ビデオ（失敗時のみ）
    video: 'retain-on-failure',
  },

  // テスト対象ブラウザ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // スマホテスト（後で追加可能）
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Live Server が既に起動していることを前提
  // webServer設定をコメントアウトして既存サーバーを使用
  /*
  webServer: {
    command: 'echo "Please start Live Server manually on port 5500"',
    port: 5500,
    timeout: 3 * 1000,
    reuseExistingServer: true,
  },
  */
});
