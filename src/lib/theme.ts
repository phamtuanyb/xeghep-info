/**
 * Resolve giao diện theo tenant + gating theo gói (CLAUDE.md Mục 11).
 *
 * Nguyên tắc bất biến: NỘI DUNG TÁCH KHỎI GIAO DIỆN. Hàm ở đây chỉ quyết định
 * theme KEY để render; dữ liệu nội dung (HomeContent, Route, ...) không phụ thuộc theme.
 *
 *  - Free: chỉ được theme 'default'. Nếu tenant lỡ trỏ theme khác -> ép về 'default'.
 *  - Pro: được chọn theme isActive với minPlan <= PRO.
 */
import type { Theme } from '@prisma/client';
import { dbAdmin } from './db';
import { getPlan, can } from './entitlement';

export const DEFAULT_THEME_KEY = 'default';

/** Danh sách giao diện tenant được phép chọn (để hiển thị ở Tenant Admin). */
export async function getAvailableThemes(tenantId: string): Promise<Theme[]> {
  const plan = await getPlan(tenantId);

  if (plan.name !== 'PRO') {
    return dbAdmin.theme.findMany({
      where: { key: DEFAULT_THEME_KEY, isActive: true },
    });
  }

  return dbAdmin.theme.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Trả về theme KEY có hiệu lực để render cho tenant. Áp gating: nếu theme đang chọn
 * không hợp lệ với gói (vd Free trỏ theme Pro), ép về 'default'.
 */
export async function resolveActiveThemeKey(tenantId: string): Promise<string> {
  const tenant = await dbAdmin.tenant.findUnique({
    where: { id: tenantId },
    include: { theme: true },
  });

  const theme = tenant?.theme;
  if (!theme || !theme.isActive || theme.key === DEFAULT_THEME_KEY) {
    return DEFAULT_THEME_KEY;
  }

  // Theme khác default -> cần quyền chọn theme (Pro).
  const allowed = await can(tenantId, 'themeSelection');
  if (!allowed) return DEFAULT_THEME_KEY;

  return theme.key;
}
