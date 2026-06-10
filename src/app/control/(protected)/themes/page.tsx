import { dbAdmin } from '@/lib/db';
import { upsertThemeAction, toggleThemeAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const themes = await dbAdmin.theme.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Kho giao diện (theme)</h1>
      <p className="text-sm text-slate-500">
        Thêm/sửa giao diện, đặt gói tối thiểu (minPlan) và bật/tắt. Giao diện đang bật sẽ tự xuất hiện cho
        tenant Pro chọn — không cần sửa từng site.
      </p>

      {/* Thêm theme mới */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Thêm giao diện mới</h2>
        <form action={upsertThemeAction} className="grid items-end gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Key</label>
            <input name="key" required placeholder="theme-c" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên hiển thị</label>
            <input name="name" required placeholder="Giao diện Hiện đại" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gói tối thiểu</label>
            <select name="minPlan" defaultValue="PRO" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" /> Bật
          </label>
          <div className="md:col-span-4">
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Thêm giao diện
            </button>
          </div>
        </form>
      </section>

      {/* Danh sách theme */}
      <section className="space-y-4">
        {themes.map((theme) => (
          <div key={theme.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">{theme.name}</span>
                <span className="ml-2 text-xs text-slate-400">({theme.key})</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  theme.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {theme.isActive ? 'Đang bật' : 'Đã tắt'}
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <form action={upsertThemeAction} className="grid flex-1 items-end gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={theme.id} />
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Key</label>
                  <input name="key" defaultValue={theme.key} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Tên</label>
                  <input name="name" defaultValue={theme.name} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">minPlan</label>
                  <select name="minPlan" defaultValue={theme.minPlan} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isActive" defaultChecked={theme.isActive} className="h-4 w-4" /> Bật
                </label>
                <div className="md:col-span-4">
                  <button className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-blue-50">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
              <form action={toggleThemeAction}>
                <input type="hidden" name="themeId" value={theme.id} />
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                  {theme.isActive ? 'Tắt' : 'Bật'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
