import { test, expect } from '@playwright/test';
import { T, PASSWORD } from './helpers';

/**
 * Tài khoản khách (CLAUDE.md Mục 12.A): đăng ký bằng email -> vào trang cá nhân.
 */
test('khách đăng ký -> vào trang cá nhân', async ({ page }) => {
  const email = `khach.e2e.${Date.now()}@test.vn`;

  await page.goto(T.free.base + '/tai-khoan/dang-ky');
  await page.fill('input[name="fullName"]', 'Khách Đăng Ký');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button:has-text("Đăng ký")');

  await expect(page).toHaveURL(/\/tai-khoan\/ho-so/);
  await expect(page.getByRole('heading', { name: 'Trang cá nhân' })).toBeVisible();
  // Email hiển thị trong ô input (disabled) -> kiểm tra theo value, không phải text.
  await expect(page.locator(`input[value="${email}"]`)).toBeVisible();
});
