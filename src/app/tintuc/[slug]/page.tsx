/**
 * Chi tiết bài tin tức (CLAUDE.md Mục 12.A): nội dung (đã sanitize khi lưu), bài liên
 * quan, banner cột bên, URL slug SEO. Dữ liệu qua Data Cache theo tenant (PHA 2).
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { renderInThemeShell } from '@/lib/public-tenant';
import { getArticleDetail } from '@/lib/public-cache';
import { buildTenantMetadata, currentTenantFromHeaders } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tenant = await currentTenantFromHeaders();
  const article = tenant ? await getArticleDetail(tenant.id, params.slug) : null;
  return buildTenantMetadata({
    path: `/tintuc/${params.slug}`,
    pageTitle: article?.title ?? 'Bài viết',
    pageDescription: article?.title,
  });
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  return renderInThemeShell(async ({ tenant }) => {
    const article = await getArticleDetail(tenant.id, params.slug);
    if (!article) notFound();

    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <h1 className="font-heading text-3xl font-bold text-slate-800">{article.title}</h1>
            {article.publishedAt && (
              <p className="mt-2 text-sm text-slate-400">{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</p>
            )}
            {article.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.coverUrl} alt={article.title} className="mt-4 w-full rounded-2xl object-cover" />
            )}
            {/* contentHtml ĐÃ được sanitize trước khi lưu (CLAUDE.md Mục 1.5) */}
            <div
              className="prose mt-6 max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          </article>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-800">Bài liên quan</h2>
              {article.related.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có bài khác.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {article.related.map((r) => (
                    <li key={r.id}>
                      <Link href={`/tintuc/${r.slug}`} className="text-slate-600 hover:text-[color:var(--brand)]">
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-[var(--brand)] p-5 text-center text-white">
              <p className="font-semibold">Cần đặt xe ngay?</p>
              <Link href="/tim-chuyen" className="mt-3 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand)]">
                Tìm chuyến
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  });
}
