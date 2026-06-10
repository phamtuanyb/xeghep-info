import { test, expect } from '@playwright/test';

/**
 * Onboarding tự động (CLAUDE.md Mục 14 PHA 2): khách nhập mã kích hoạt -> tự tạo
 * tenant + subdomain. Dùng mã demo trong seed (DEMO-PRO-2026). Trang cấp nền tảng,
 * truy cập trên host trần localhost (không cần tenant).
 */
test('kích hoạt bằng mã -> tạo website thành công', async ({ page }) => {
  await page.goto('http://localhost:3100/kich-hoat');

  await page.fill('input[name="code"]', 'DEMO-PRO-2026');
  await page.fill('input[name="brandName"]', 'Nhà xe E2E Code');
  await page.fill('input[name="slug"]', 'nha-xe-e2e-code');
  await page.fill('input[name="ownerEmail"]', 'owner@e2e-code.vn');
  await page.fill('input[name="ownerPassword"]', 'matkhau123');
  await page.click('button:has-text("Tạo website của tôi")');

  await expect(page).toHaveURL(/\/kich-hoat\/thanh-cong/);
  await expect(page.getByText(/Tạo website thành công/)).toBeVisible();
  await expect(page.getByText('nha-xe-e2e-code', { exact: false })).toBeVisible();
});
