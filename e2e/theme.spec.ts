import { test, expect, type Page } from '@playwright/test';
import { T, loginViaForm } from './helpers';

/**
 * Đổi giao diện (CLAUDE.md Mục 11): tenant Pro đổi theme -> trang công khai render
 * theme mới NHƯNG nội dung (thương hiệu) không đổi. Chứng minh "nội dung tách khỏi giao diện".
 *
 * Sau khi bấm chọn theme, CHỜ admin UI xác nhận "Đang dùng" (server action đã cập nhật DB
 * + revalidateTag xong) rồi mới mở trang công khai — tránh đua với cache busting.
 */
async function selectTheme(page: Page, base: string, themeName: string) {
  await page.goto(base + '/admin/giao-dien');
  const card = page.locator('form', { hasText: themeName });
  await card.getByRole('button').click();
  await expect(card.getByRole('button')).toHaveText('Đang dùng', { timeout: 15_000 });
}

test('Pro đổi theme: render đổi, nội dung giữ nguyên', async ({ page }) => {
  await loginViaForm(page, T.pro.base, '/admin/dang-nhap', T.pro.admin);

  // Đổi sang "Giao diện Tối giản" (theme-b).
  await selectTheme(page, T.pro.base, 'Giao diện Tối giản');
  await page.goto(T.pro.base + '/');
  await expect(page.locator('[data-theme="theme-b"]')).toBeVisible();
  await expect(page.getByText(T.pro.brand).first()).toBeVisible(); // nội dung không đổi

  // Đổi lại "Giao diện Năng động" (theme-a) và kiểm chứng render đổi tương ứng.
  await selectTheme(page, T.pro.base, 'Giao diện Năng động');
  await page.goto(T.pro.base + '/');
  await expect(page.locator('[data-theme="theme-a"]')).toBeVisible();
});
