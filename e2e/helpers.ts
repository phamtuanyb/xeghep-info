import type { Page } from '@playwright/test';

/** Đa tenant qua subdomain .localhost (khớp seed). */
export const T = {
  free: {
    base: 'http://nha-xe-an-binh.localhost:3100',
    brand: 'Nhà xe An Bình',
    admin: 'chuxe@an-binh.vn',
    driver: 'taixe1@nha-xe-an-binh.vn',
    theme: 'default',
  },
  pro: {
    base: 'http://nha-xe-phuong-nam.localhost:3100',
    brand: 'Nhà xe Phương Nam',
    admin: 'chuxe@phuong-nam.vn',
    driver: 'taixe1@nha-xe-phuong-nam.vn',
    theme: 'theme-a',
  },
  onboarding: {
    base: 'http://nha-xe-moi.localhost:3100',
    brand: 'Nhà xe Mới',
    admin: 'chuxe@moi.vn',
  },
};

export const PASSWORD = 'MatKhau@123';

/** Đăng nhập qua form (admin/tài xế/khách) rồi chờ điều hướng. */
export async function loginViaForm(page: Page, base: string, loginPath: string, email: string, password = PASSWORD) {
  await page.goto(base + loginPath);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Đăng nhập")');
  // Chờ server action redirect HOÀN TẤT (rời khỏi trang đăng nhập) trước khi đi tiếp,
  // nếu không page.goto kế tiếp sẽ đua với điều hướng đăng nhập đang dang dở.
  await page.waitForURL((u) => !u.pathname.endsWith('/dang-nhap'), { timeout: 30_000 });
}
