import { test, expect } from '@playwright/test';
import { T, loginViaForm } from './helpers';

/**
 * Cổng tài xế (CLAUDE.md Mục 12.C): PRO = tài xế tự đăng chuyến; FREE = chỉ xem.
 */
test('tài xế Pro: thấy form tự đăng chuyến', async ({ page }) => {
  await loginViaForm(page, T.pro.base, '/tai-xe/dang-nhap', T.pro.driver);
  await page.goto(T.pro.base + '/tai-xe/chuyen');
  await expect(page.getByText('Đăng chuyến mới')).toBeVisible();
});

test('tài xế Free: chỉ xem, có thông báo gói Free', async ({ page }) => {
  await loginViaForm(page, T.free.base, '/tai-xe/dang-nhap', T.free.driver);
  await page.goto(T.free.base + '/tai-xe/chuyen');
  await expect(page.getByText(/Gói Free: chủ xe sẽ thêm chuyến giúp/)).toBeVisible();
  await expect(page.getByText('Đăng chuyến mới')).toHaveCount(0);
});
