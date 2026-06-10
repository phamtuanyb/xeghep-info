import { test, expect } from '@playwright/test';
import { T } from './helpers';

/**
 * SEO per-tenant (CLAUDE.md Mục 13): robots.txt + sitemap.xml động theo domain tenant;
 * metadata trang chủ theo tenant. Dùng page.goto (Chromium phân giải *.localhost).
 */
test('robots.txt theo tenant: có Sitemap + chặn khu riêng', async ({ page }) => {
  const resp = await page.goto(T.free.base + '/robots.txt');
  expect(resp?.ok()).toBeTruthy();
  const body = (await resp!.text()).toLowerCase();
  expect(body).toContain('sitemap:');
  expect(body).toContain('disallow: /admin');
});

test('sitemap.xml theo tenant: chứa host + bài viết', async ({ page }) => {
  const resp = await page.goto(T.free.base + '/sitemap.xml');
  expect(resp?.ok()).toBeTruthy();
  const xml = await resp!.text();
  expect(xml).toContain('nha-xe-an-binh.localhost');
  expect(xml).toContain('/tintuc/'); // seed có bài viết published
});

test('metadata trang chủ lấy theo tenant', async ({ page }) => {
  await page.goto(T.free.base + '/');
  await expect(page).toHaveTitle(/An Bình/);
});
