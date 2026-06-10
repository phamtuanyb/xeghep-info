import { test, expect } from '@playwright/test';
import { T, loginViaForm } from './helpers';

/**
 * Onboarding wizard (CLAUDE.md Mục 14 M4): chủ xe lần đầu đăng nhập bị đưa vào wizard;
 * bấm "Xuất bản" -> site công khai chạy ngay (status ACTIVE + onboardedAt).
 *
 * Lưu ý: test này thay đổi tenant C (onboardedAt). Chạy lại cần `npm run db:reset`.
 */
test('chủ xe mới: wizard -> xuất bản -> dashboard', async ({ page }) => {
  await loginViaForm(page, T.onboarding.base, '/admin/dang-nhap', T.onboarding.admin);

  // Lần đầu -> bị đưa vào wizard.
  await expect(page).toHaveURL(/\/admin\/khoi-tao/);
  await expect(page.getByRole('heading', { name: 'Khởi tạo website của bạn' })).toBeVisible();

  // Điền 1 tuyến phổ biến, giữ thương hiệu mặc định, chọn giao diện mặc định (đã sẵn).
  await page.fill('input[name="route_from_0"]', 'Hà Nội');
  await page.fill('input[name="route_to_0"]', 'Hải Phòng');
  await page.fill('input[name="route_price_0"]', '150000');

  await page.click('button:has-text("Xuất bản website")');

  // Về dashboard với banner đã xuất bản.
  await expect(page).toHaveURL(/\/admin\?published=1/);
  await expect(page.getByText(/Website đã được xuất bản/)).toBeVisible();
});
