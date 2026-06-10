/**
 * robots.txt động theo tenant (CLAUDE.md Mục 13). Tôn trọng TenantSetting.allowIndex.
 */
import type { MetadataRoute } from 'next';
import { currentTenantFromHeaders, getTenantSetting, currentBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = currentBaseUrl();
  const tenant = await currentTenantFromHeaders();

  if (!tenant) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const setting = await getTenantSetting(tenant.id);
  const allow = setting?.allowIndex !== false;

  return {
    rules: allow
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/control', '/tai-xe', '/tai-khoan', '/api'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
