/**
 * Tiện ích cho Public site (CLAUDE.md Mục 12.A): giải tenant theo host (header do
 * middleware đặt) rồi chạy logic trong tenant context.
 *
 * QUAN TRỌNG (xem memory runwithtenant-await-inside): mọi truy vấn db PHẢI được
 * AWAIT BÊN TRONG callback của runWithTenant. Các hàm dưới đảm bảo điều đó.
 */
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { dbAdmin } from './db';
import { runWithTenant } from './tenant-context';
import { resolveTenantByHost, type ResolvedTenant } from './tenant-resolver';
import { resolveActiveThemeKey } from './theme';
import { shouldShowPoweredBy } from './entitlement';
import { getTheme } from '@/themes';

/** Giải tenant hiện tại cho public site. 404 nếu không có tenant ACTIVE. */
export async function getPublicTenant(): Promise<ResolvedTenant> {
  const h = headers();
  const host = h.get('x-tenant-host') ?? h.get('host') ?? '';
  const slug = h.get('x-tenant-slug');

  const result = await resolveTenantByHost(host, slug);
  if (result.ok) return result.tenant;

  // Dev fallback: localhost trần (không subdomain) -> lấy tenant ACTIVE đầu tiên để xem thử.
  if (process.env.NODE_ENV !== 'production') {
    const fallback = await dbAdmin.tenant.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        brandName: true,
        themeId: true,
        primaryColor: true,
        logoUrl: true,
        hotline: true,
        customDomain: true,
      },
    });
    if (fallback) return fallback;
  }

  notFound();
}

/** Chạy `fn` trong tenant context của public site (await mọi db BÊN TRONG fn). */
export async function withPublicTenant<T>(fn: (tenant: ResolvedTenant) => Promise<T>): Promise<T> {
  const tenant = await getPublicTenant();
  return runWithTenant(tenant.id, () => fn(tenant));
}

/**
 * Bọc nội dung trang trong Shell của theme đang áp dụng cho tenant. Dùng cho mọi
 * trang public để header/footer (gồm footer "Powered by MKT" theo gói) nhất quán.
 */
export async function renderInThemeShell(
  build: (ctx: { tenant: ResolvedTenant }) => Promise<ReactNode>
): Promise<ReactNode> {
  return withPublicTenant(async (tenant) => {
    const [themeKey, showPoweredBy, content] = await Promise.all([
      resolveActiveThemeKey(tenant.id),
      shouldShowPoweredBy(tenant.id),
      build({ tenant }),
    ]);
    const theme = getTheme(themeKey);
    const Shell = theme.Shell;
    return (
      <Shell tenant={tenant} showPoweredBy={showPoweredBy}>
        {content}
      </Shell>
    );
  });
}
