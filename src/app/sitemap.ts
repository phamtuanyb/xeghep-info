/**
 * sitemap.xml động theo tenant (CLAUDE.md Mục 13): trang tĩnh + mọi bài tin tức +
 * tài xế đã xác thực, theo domain thực của tenant.
 */
import type { MetadataRoute } from 'next';
import { dbAdmin } from '@/lib/db';
import { currentTenantFromHeaders, currentBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = currentBaseUrl();
  const tenant = await currentTenantFromHeaders();
  if (!tenant) return [];

  const [articles, drivers] = await Promise.all([
    dbAdmin.article.findMany({
      where: { tenantId: tenant.id, status: 'published' },
      select: { slug: true, publishedAt: true },
    }),
    dbAdmin.driver.findMany({ where: { tenantId: tenant.id, kycStatus: 'approved' }, select: { id: true } }),
  ]);

  const staticPaths = ['', '/tim-chuyen', '/tai-xe-doi-tac', '/tintuc'];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: base + p,
    changeFrequency: 'daily',
    priority: p === '' ? 1 : 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/tintuc/${a.slug}`,
    lastModified: a.publishedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const driverPages: MetadataRoute.Sitemap = drivers.map((d) => ({
    url: `${base}/tai-xe-doi-tac/${d.id}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticPages, ...articlePages, ...driverPages];
}
