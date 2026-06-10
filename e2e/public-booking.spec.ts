import { test, expect } from '@playwright/test';
import { T, loginViaForm } from './helpers';

/**
 * Luồng vàng (CLAUDE.md Mục 12.A & 15): khách mở site -> tìm chuyến -> đặt chỗ ->
 * màn xác nhận; sau đó chủ xe đăng nhập thấy lead.
 */
test('khách đặt chỗ -> xác nhận -> admin thấy lead', async ({ page }) => {
  const customerName = `Khách E2E ${Date.now()}`;

  // 1) Trang chủ tenant Free hiển thị đúng thương hiệu.
  await page.goto(T.free.base + '/');
  await expect(page.getByText(T.free.brand).first()).toBeVisible();

  // 2) Tìm chuyến -> mở chi tiết chuyến đầu tiên.
  await page.goto(T.free.base + '/tim-chuyen');
  const tripLink = page.locator('a[href^="/chuyen/"]').first();
  await expect(tripLink).toBeVisible();
  await tripLink.click();

  // 3) Điền thông tin đặt chỗ và gửi.
  await expect(page.getByRole('heading', { name: 'Đặt chỗ' })).toBeVisible();
  await page.fill('input[name="customerName"]', customerName);
  await page.fill('input[name="customerPhone"]', '0901234567');
  await page.click('button:has-text("Gửi yêu cầu đặt chỗ")');

  // 4) Màn xác nhận.
  await expect(page).toHaveURL(/\/dat-cho-thanh-cong/);
  await expect(page.getByText('Đặt chỗ thành công')).toBeVisible();

  // 5) Chủ xe đăng nhập -> thấy lead vừa tạo.
  await loginViaForm(page, T.free.base, '/admin/dang-nhap', T.free.admin);
  await page.goto(T.free.base + '/admin/lead');
  await expect(page.getByText(customerName)).toBeVisible();
});
