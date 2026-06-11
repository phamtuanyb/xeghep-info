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

/** Bọc mỗi <table> trong khung cuộn ngang để bảng rộng (từ Word) không vỡ layout. */
function wrapTablesScrollable(html: string): string {
  return html
    .replace(/<table(\b[^>]*)>/gi, '<div style="overflow-x:auto;max-width:100%"><table$1>')
    .replace(/<\/table>/gi, '</table></div>');
}

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
            {/* contentHtml ĐÃ được sanitize trước khi lưu (CLAUDE.md Mục 1.5).
                Style trực tiếp cho thẻ con (link/heading/list/bảng...) vì dự án không dùng plugin typography.
                Bọc <table> trong khung cuộn ngang để bảng rộng không vỡ layout trên mobile. */}
            <div
              className="mt-6 max-w-none text-[15px] leading-7 text-slate-700 [&_a]:font-medium [&_a]:text-[color:var(--brand)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h3]:mt-5 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800 [&_img]:my-4 [&_img]:rounded-xl [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-800 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:align-top"
              dangerouslySetInnerHTML={{ __html: wrapTablesScrollable(article.contentHtml) }}
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
