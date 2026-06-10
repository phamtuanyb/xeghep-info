import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (CLAUDE.md Mục 2 & 15). Chạy trên `next dev` để cookie phiên không bị Secure-only
 * trên http. Đa tenant qua subdomain <slug>.localhost (Chromium tự phân giải về 127.0.0.1).
 * Một worker vì các test dùng chung một database.
 *
 * Chuẩn bị dữ liệu trước khi chạy: `npm run db:reset` (reset + seed).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts', // xóa rate-limit keys trước mỗi lần chạy
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Port riêng 3100 để tránh đụng dự án khác đang chạy ở 3000.
  webServer: {
    command: 'npm run dev -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
