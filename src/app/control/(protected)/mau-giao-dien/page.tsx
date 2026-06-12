/**
 * Quản lý "Mẫu giao diện website" trên trang giới thiệu gốc xeghep.info (Control Plane).
 * Super Admin: tải ảnh xem trước + nhập link website demo live. Chỉ SUPER_ADMIN.
 */
import { dbAdmin } from '@/lib/db';
import SingleImageUpload from '@/components/admin/SingleImageUpload';
import { upsertLandingTemplateAction, deleteLandingTemplateAction } from '../../actions';

export const dynamic = 'force-dynamic';

function Field({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
}

function TemplateForm({ t }: { t?: { id: string; name: string; tag: string; description: string; imageUrl: string | null; demoUrl: string | null; sortOrder: number; isActive: boolean } }) {
  return (
    <form action={upsertLandingTemplateAction} className="grid gap-3 md:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field name="name" label="Tên mẫu" defaultValue={t?.name} placeholder="VD: Mẫu Năng Động" />
      <div>
        <label className="mb-1 block text-xs text-slate-500">Gói</label>
        <select name="tag" defaultValue={t?.tag ?? 'Pro'} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs text-slate-500">Mô tả ngắn</label>
        <textarea name="description" rows={2} defaultValue={t?.description} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <Field name="demoUrl" label="Link website demo (khách bấm sẽ mở site thật)" defaultValue={t?.demoUrl ?? ''} placeholder="VD: https://nha-xe-phuong-nam.xeghep.info" />
      <Field name="sortOrder" label="Thứ tự hiển thị" defaultValue={String(t?.sortOrder ?? 0)} placeholder="0" />
      <div className="md:col-span-2">
        <SingleImageUpload name="imageUrl" defaultValue={t?.imageUrl ?? ''} endpoint="/api/control/upload" label="Ảnh xem trước" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isActive" defaultChecked={t ? t.isActive : true} className="h-4 w-4" /> Hiển thị
      </label>
      <div className="md:col-span-2">
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {t ? 'Lưu thay đổi' : 'Thêm mẫu'}
        </button>
      </div>
    </form>
  );
}

export default async function LandingTemplatesPage({ searchParams }: { searchParams: { saved?: string } }) {
  const templates = await dbAdmin.landingTemplate.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mẫu giao diện website</h1>
      <p className="text-sm text-slate-500">
        Quản lý các mẫu hiển thị ở mục “Mẫu giao diện website” trên trang giới thiệu gốc <strong>xeghep.info</strong>.
        Tải ảnh xem trước và dán link website demo — khách bấm “Xem mẫu” sẽ mở site thật để kiểm tra giao diện.
      </p>

      {searchParams.saved && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">✅ Đã lưu.</p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Thêm mẫu mới</h2>
        <TemplateForm />
      </section>

      <section className="space-y-4">
        {templates.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={t.name} className="h-12 w-20 rounded-md object-cover" />
                ) : (
                  <div className="flex h-12 w-20 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400">Chưa có ảnh</div>
                )}
                <div>
                  <span className="font-semibold text-slate-800">{t.name}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${t.tag === 'Free' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{t.tag}</span>
                  {!t.isActive && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">Ẩn</span>}
                  {t.demoUrl && (
                    <a href={t.demoUrl} target="_blank" rel="noopener" className="ml-2 text-xs text-brand hover:underline">
                      mở demo ↗
                    </a>
                  )}
                </div>
              </div>
              <form action={deleteLandingTemplateAction}>
                <input type="hidden" name="id" value={t.id} />
                <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Xóa</button>
              </form>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-slate-500">Sửa</summary>
              <div className="mt-3">
                <TemplateForm t={t} />
              </div>
            </details>
          </div>
        ))}
        {templates.length === 0 && <p className="text-center text-slate-400">Chưa có mẫu nào. Thêm mẫu ở trên.</p>}
      </section>
    </div>
  );
}
