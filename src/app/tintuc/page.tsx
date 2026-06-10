/**
 * Tin tức (CLAUDE.md Mục 12.A): danh sách phân trang 14 bài/trang, URL slug SEO.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { renderInThemeShell } from '@/lib/public-tenant';
import { getPublishedArticles } from '@/lib/public-cache';
import { buildTenantMetadata } from '@/lib/seo';
import { SectionHeading } from '@/themes/shared';

export const dynamic = 'force-dynamic';

const PER_PAGE = 14;

export function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata({ path: '/tintuc', pageTitle: 'Tin tức & cẩm nang', pageDescription: 'Tin tức, kinh nghiệm và cẩm nang đi xe ghép.' });
}

export default async function NewsListPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  return renderInThemeShell(async ({ tenant }) => {
    const { items: articles, total } = await getPublishedArticles(tenant.id, page, PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading title="Tin tức & cẩm nang" />

        {articles.length === 0 ? (
          <p className="text-center text-slate-400">Chưa có bài viết.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/tintuc/${a.slug}`} className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
                <div className="h-40 bg-slate-100">
                  {a.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverUrl} alt={a.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-slate-800 line-clamp-2">{a.title}</h2>
                  {a.publishedAt && (
                    <p className="mt-1 text-xs text-slate-400">{new Date(a.publishedAt).toLocaleDateString('vi-VN')}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/tintuc?page=${p}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${p === page ? 'bg-[var(--brand)] text-white' : 'bg-white text-slate-600 shadow-sm'}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  });
}
