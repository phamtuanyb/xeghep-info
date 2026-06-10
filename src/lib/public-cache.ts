/**
 * Cache dữ liệu công khai theo tenant (CLAUDE.md Mục 14 PHA 2 — tối ưu tải cao).
 *
 * Dùng Next.js Data Cache (`unstable_cache`) thay cho ISR tĩnh — vì trang công khai
 * phân giải theo HOST (đa tenant) nên không thể prerender tĩnh lúc build. Ta cache
 * KẾT QUẢ TRUY VẤN theo tenantId (key có tenantId) + revalidate theo thời gian + tag
 * để admin sửa nội dung thì xóa cache ngay.
 *
 * QUAN TRỌNG: hàm trong unstable_cache chạy NGOÀI request context (không có ALS),
 * nên BẮT BUỘC dùng `dbAdmin` + lọc tenantId TƯỜNG MINH (an toàn vì key đã gồm tenantId).
 */
import { unstable_cache, revalidateTag } from 'next/cache';
import { dbAdmin } from './db';
import { parseHomeContent, type HomeContentData } from './home-content';
import { resolveActiveThemeKey } from './theme';
import { shouldShowPoweredBy } from './entitlement';

const TTL = 60; // giây — nội dung công khai làm mới mỗi 60s nếu không có thao tác sửa

/** Tag bao trùm toàn bộ dữ liệu công khai của một tenant. */
export function tenantTag(tenantId: string): string {
  return `tenant-public:${tenantId}`;
}

/** Gọi trong admin action sau khi sửa nội dung -> xóa cache công khai của tenant. */
export function revalidateTenantPublic(tenantId: string): void {
  revalidateTag(tenantTag(tenantId));
}

export type HomeRouteDTO = { id: string; fromName: string; toName: string; slug: string; priceFrom: number; icon: string | null; distanceKm: number | null; durationText: string | null };
export type HomeDriverDTO = { id: string; fullName: string; avatarUrl: string | null; carType: string | null; rating: number; tripCount: number };
export type HomeBundle = {
  content: HomeContentData;
  routes: HomeRouteDTO[];
  drivers: HomeDriverDTO[];
  themeKey: string;
  showPoweredBy: boolean;
};

/** Gói dữ liệu trang chủ (nội dung + tuyến + tài xế + theme) — cache theo tenant. */
export function getHomeBundle(tenantId: string): Promise<HomeBundle> {
  return unstable_cache(
    async (): Promise<HomeBundle> => {
      const [homeRow, routes, drivers, themeKey, showPoweredBy] = await Promise.all([
        dbAdmin.homeContent.findFirst({ where: { tenantId } }),
        dbAdmin.route.findMany({
          where: { tenantId },
          take: 6,
          orderBy: { priceFrom: 'asc' },
          select: { id: true, fromName: true, toName: true, slug: true, priceFrom: true, icon: true, distanceKm: true, durationText: true },
        }),
        dbAdmin.driver.findMany({
          where: { tenantId, kycStatus: 'approved' },
          take: 8,
          orderBy: { rating: 'desc' },
          select: { id: true, fullName: true, avatarUrl: true, carType: true, rating: true, tripCount: true },
        }),
        resolveActiveThemeKey(tenantId),
        shouldShowPoweredBy(tenantId),
      ]);
      return { content: parseHomeContent(homeRow?.data), routes, drivers, themeKey, showPoweredBy };
    },
    ['home-bundle', tenantId],
    { tags: [tenantTag(tenantId)], revalidate: TTL }
  )();
}

/** Danh sách tài xế đã xác thực — cache theo tenant. */
export function getApprovedDrivers(tenantId: string): Promise<HomeDriverDTO[]> {
  return unstable_cache(
    async () =>
      dbAdmin.driver.findMany({
        where: { tenantId, kycStatus: 'approved' },
        orderBy: { rating: 'desc' },
        select: { id: true, fullName: true, avatarUrl: true, carType: true, rating: true, tripCount: true },
      }),
    ['approved-drivers', tenantId],
    { tags: [tenantTag(tenantId)], revalidate: TTL }
  )();
}

export type ArticleListItem = { id: string; title: string; slug: string; coverUrl: string | null; publishedAt: string | null };

/** Danh sách bài viết (phân trang) — cache theo tenant + trang. */
export function getPublishedArticles(
  tenantId: string,
  page: number,
  perPage: number
): Promise<{ items: ArticleListItem[]; total: number }> {
  return unstable_cache(
    async () => {
      const [rows, total] = await Promise.all([
        dbAdmin.article.findMany({
          where: { tenantId, status: 'published' },
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
          select: { id: true, title: true, slug: true, coverUrl: true, publishedAt: true },
        }),
        dbAdmin.article.count({ where: { tenantId, status: 'published' } }),
      ]);
      const items: ArticleListItem[] = rows.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        coverUrl: a.coverUrl,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      }));
      return { items, total };
    },
    ['articles', tenantId, String(page), String(perPage)],
    { tags: [tenantTag(tenantId)], revalidate: TTL }
  )();
}

export type ArticleDetail = {
  title: string;
  slug: string;
  coverUrl: string | null;
  contentHtml: string;
  publishedAt: string | null;
  related: { id: string; title: string; slug: string }[];
};

/** Chi tiết bài viết + bài liên quan — cache theo tenant + slug. Null nếu không có. */
export function getArticleDetail(tenantId: string, slug: string): Promise<ArticleDetail | null> {
  return unstable_cache(
    async (): Promise<ArticleDetail | null> => {
      const article = await dbAdmin.article.findFirst({ where: { tenantId, slug, status: 'published' } });
      if (!article) return null;
      const related = await dbAdmin.article.findMany({
        where: { tenantId, status: 'published', id: { not: article.id } },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true },
      });
      return {
        title: article.title,
        slug: article.slug,
        coverUrl: article.coverUrl,
        contentHtml: article.contentHtml,
        publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
        related,
      };
    },
    ['article-detail', tenantId, slug],
    { tags: [tenantTag(tenantId)], revalidate: TTL }
  )();
}
