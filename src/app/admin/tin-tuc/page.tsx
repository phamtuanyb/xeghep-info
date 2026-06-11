/**
 * Tin tức (CLAUDE.md Mục 12.B): soạn + đăng, đăng bằng .docx (một file hoặc cả thư
 * mục nhiều .docx), sanitize HTML trước khi lưu, ảnh bìa chọn/ngẫu nhiên, thống kê.
 * Chỉ Quản trị.
 */
import Link from 'next/link';
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { Card, DeleteButton, FlashOk } from '@/components/admin/ui';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ArticleImageLibrary from '@/components/admin/ArticleImageLibrary';
import { upsertArticleAction, deleteArticleAction, importDocxAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewsAdminPage({ searchParams }: { searchParams: { saved?: string; imported?: string } }) {
  return renderAdmin(async () => {
    const [articles, published, draft] = await Promise.all([
      db.article.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      db.article.count({ where: { status: 'published' } }),
      db.article.count({ where: { status: 'draft' } }),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Tin tức</h1>
          <span className="text-sm text-slate-500">Đã đăng: {published} · Nháp: {draft} · Tổng: {articles.length}</span>
        </div>

        <FlashOk message={searchParams.saved ? 'Đã lưu bài viết.' : searchParams.imported ? `Đã nhập ${searchParams.imported} bài từ .docx.` : undefined} />

        {/* Kho ảnh bài viết (riêng từng website) */}
        <Card title="Kho ảnh bài viết (riêng website này)">
          <ArticleImageLibrary />
        </Card>

        {/* Import .docx */}
        <Card title="Đăng bằng file Word (.docx)">
          <form action={importDocxAction} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Chọn nhiều file .docx</label>
                <input type="file" name="files" accept=".docx" multiple className="w-full text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Hoặc chọn cả thư mục</label>
                <input type="file" name="files" accept=".docx" multiple {...({ webkitdirectory: '' } as Record<string, string>)} className="w-full text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <label className="flex items-center gap-2"><input type="checkbox" name="randomCover" defaultChecked className="h-4 w-4" /> Tự gán ảnh bìa</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="publish" className="h-4 w-4" /> Đăng ngay (không lưu nháp)</label>
            </div>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Nhập & tạo bài</button>
            <p className="text-xs text-slate-400">Nội dung Word được chuyển sang HTML và <strong>sanitize</strong> trước khi lưu.</p>
          </form>
        </Card>

        {/* Soạn bài */}
        <Card title="Soạn bài mới">
          <form action={upsertArticleAction} className="space-y-3">
            <input name="title" required placeholder="Tiêu đề" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input name="coverUrl" placeholder="URL ảnh bìa — để trống sẽ tự lấy ngẫu nhiên từ kho ảnh" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <RichTextEditor name="contentHtml" />
            <p className="text-xs text-slate-400">Ảnh bìa & 1 ảnh trong bài tự lấy ngẫu nhiên từ <strong>Kho ảnh bài viết</strong> của website này (mục phía trên) nếu bạn không tự thêm.</p>
            <div className="flex items-center gap-3">
              <select name="status" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="draft">Lưu nháp</option>
                <option value="published">Đăng ngay</option>
              </select>
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu bài</button>
            </div>
          </form>
        </Card>

        {/* Danh sách + sửa */}
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{a.title}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {a.status === 'published' ? 'Đã đăng' : 'Nháp'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'published' && (
                    <Link href={`/tintuc/${a.slug}`} target="_blank" className="text-sm text-brand hover:underline">Xem</Link>
                  )}
                  <DeleteButton action={deleteArticleAction} id={a.id} />
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-sm text-slate-500">Sửa nội dung</summary>
                <form action={upsertArticleAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input name="title" defaultValue={a.title} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input name="slug" defaultValue={a.slug} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input name="coverUrl" defaultValue={a.coverUrl ?? ''} placeholder="URL ảnh bìa" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <RichTextEditor name="contentHtml" defaultValue={a.contentHtml} />
                  <div className="flex items-center gap-3">
                    <select name="status" defaultValue={a.status} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option value="draft">Nháp</option>
                      <option value="published">Đăng</option>
                    </select>
                    <button className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">Lưu</button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {articles.length === 0 && <p className="text-center text-slate-400">Chưa có bài viết.</p>}
        </div>
      </div>
    );
  }, { adminOnly: true });
}
