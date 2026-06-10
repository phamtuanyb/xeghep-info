import { test, expect } from '@playwright/test';
import { T } from './helpers';

/**
 * Gating mã giảm giá trên UI (CLAUDE.md Mục 10/12.A): ô nhập mã CHỈ hiện ở tenant Pro
 * (server quyết định, không chỉ ẩn ở client).
 */
async function openFirstTrip(page: import('@playwright/test').Page, base: string) {
  await page.goto(base + '/tim-chuyen');
  const tripLink = page.locator('a[href^="/chuyen/"]').first();
  await expect(tripLink).toBeVisible();
  await tripLink.click();
  await expect(page.getByRole('heading', { name: 'Đặt chỗ' })).toBeVisible();
}

test('Free: KHÔNG có ô mã giảm giá', async ({ page }) => {
  await openFirstTrip(page, T.free.base);
  await expect(page.locator('input[name="couponCode"]')).toHaveCount(0);
});

test('Pro: CÓ ô mã giảm giá', async ({ page }) => {
  await openFirstTrip(page, T.pro.base);
  await expect(page.locator('input[name="couponCode"]')).toBeVisible();
});
