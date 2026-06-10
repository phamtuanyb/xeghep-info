/**
 * SEO per-tenant (CLAUDE.md Mục 13): metadata động (title/description/canonical/OG),
 * robots noindex theo allowIndex, verification Search Console. Dùng cho generateMetadata
 * của các trang public + robots.ts + sitemap.ts.
 */
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { dbAdmin } from './db';
import { resolveTenantByHost, type ResolvedTenant } from './tenant-resolver';

/** Host thực tế của request (đã bỏ port) — để dựng URL tuyệt đối. */
export function currentHost(): string {
  const h = headers();
  return (h.get('x-tenant-host') ?? h.get('host') ?? '').split(':')[0]!.toLowerCase();
}

/** Base URL tuyệt đối theo host hiện tại (https ở production). */
export function currentBaseUrl(): string {
  const host = currentHost();
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  // Giữ port ở dev để link hoạt động.
  const rawHost = headers().get('x-tenant-host') ?? headers().get('host') ?? host;
  return `${proto}://${rawHost}`;
}

/** Giải tenant hiện tại từ header (KHÔNG notFound) — null nếu không có. */
export async function currentTenantFromHeaders(): Promise<ResolvedTenant | null> {
  const h = headers();
  const host = h.get('x-tenant-host') ?? h.get('host') ?? '';
  const slug = h.get('x-tenant-slug');
  const result = await resolveTenantByHost(host, slug);
  if (result.ok) return result.tenant;

  // Dev fallback (giống public-tenant) để xem thử trên localhost trần.
  if (process.env.NODE_ENV !== 'production') {
    const fallback = await dbAdmin.tenant.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, slug: true, brandName: true, themeId: true, primaryColor: true, logoUrl: true, hotline: true, customDomain: true },
    });
    return fallback;
  }
  return null;
}

export function getTenantSetting(tenantId: string) {
  return dbAdmin.tenantSetting.findUnique({ where: { tenantId } });
}

/**
 * Dựng Metadata theo tenant + trang. `pageTitle`/`pageDescription` ghi đè tiêu đề trang;
 * nếu không, dùng SEO mặc định của tenant (TenantSetting) rồi tới brandName.
 */
export async function buildTenantMetadata(opts: {
  path: string;
  pageTitle?: string;
  pageDescription?: string;
}): Promise<Metadata> {
  const tenant = await currentTenantFromHeaders();
  if (!tenant) return { title: 'Website xe ghép' };

  const setting = await getTenantSetting(tenant.id);
  const brand = tenant.brandName;
  const base = currentBaseUrl();
  const url = base + (opts.path === '/' ? '' : opts.path);

  const title = opts.pageTitle ? `${opts.pageTitle} — ${brand}` : setting?.seoTitle || brand;
  const description =
    opts.pageDescription || setting?.seoDescription || `Dịch vụ xe ghép ${brand} — đặt xe nhanh chóng, an toàn.`;
  const allowIndex = setting?.allowIndex !== false;

  return {
    title,
    description,
    keywords: setting?.seoKeywords || undefined,
    metadataBase: new URL(base),
    alternates: { canonical: url },
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: false },
    verification: setting?.searchConsoleId ? { google: setting.searchConsoleId } : undefined,
    openGraph: { title, description, url, siteName: brand, type: 'website', locale: 'vi_VN' },
  };
}
