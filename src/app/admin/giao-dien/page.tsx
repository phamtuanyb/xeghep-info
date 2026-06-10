/**
 * Branding & giao diện (CLAUDE.md Mục 12.B & 11): logo/màu/hotline/tên miền(Pro),
 * chọn giao diện theo gói, ẩn footer "Powered by MKT" (Pro). Chỉ Quản trị.
 */
import { dbAdmin } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { getAvailableThemes } from '@/lib/theme';
import { getPlan, can } from '@/lib/entitlement';
import { Card, FlashError } from '@/components/admin/ui';
import { updateBrandingAction, selectThemeAction, toggleHidePoweredByAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function BrandingPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderAdmin(async ({ session }) => {
    const [tenant, themes, plan, canDomain, canHide] = await Promise.all([
      dbAdmin.tenant.findUnique({ where: { id: session.tenantId } }),
      getAvailableThemes(session.tenantId),
      getPlan(session.tenantId),
      can(session.tenantId, 'customDomain'),
      can(session.tenantId, 'hidePoweredBy'),
    ]);
    if (!tenant) return <p>Không tìm thấy tenant.</p>;
    const isPro = plan.name === 'PRO';

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Branding & giao diện</h1>
        <FlashError message={searchParams.error} />
        <p className="text-sm text-slate-500">Gói hiện tại: <strong>{plan.name}</strong></p>

        <Card title="Thương hiệu">
          <form action={updateBrandingAction} className="grid gap-3 md:grid-cols-2">
            <Field name="logoUrl" label="Logo (URL)" defaultValue={tenant.logoUrl ?? ''} />
            <div>
              <label className="mb-1 block text-xs text-slate-500">Màu thương hiệu</label>
              <input type="color" name="primaryColor" defaultValue={tenant.primaryColor ?? '#1565C0'} className="h-10 w-20 rounded border border-slate-200" />
            </div>
            <Field name="hotline" label="Hotline" defaultValue={tenant.hotline ?? ''} />
            <div className="md:col-span-2"><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu thương hiệu</button></div>
          </form>
          <p className="mt-3 text-sm text-slate-500">
            Tên miền riêng {canDomain ? '' : '(gói Pro)'} cấu hình tại mục{' '}
            <a href="/admin/ten-mien" className="font-semibold text-brand hover:underline">Tên miền riêng</a>.
          </p>
        </Card>

        <Card title="Chọn giao diện">
          {!isPro && <p className="mb-3 text-sm text-slate-500">Gói Free dùng giao diện mặc định. Nâng cấp Pro để chọn giao diện khác.</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => (
              <form key={t.id} action={selectThemeAction} className={`rounded-2xl border p-4 ${tenant.themeId === t.id ? 'border-brand bg-blue-50' : 'border-slate-200'}`}>
                <input type="hidden" name="themeId" value={t.id} />
                <div className="font-semibold text-slate-800">{t.name}</div>
                <div className="text-xs text-slate-400">{t.key} · tối thiểu {t.minPlan}</div>
                <button className="mt-3 w-full rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" disabled={tenant.themeId === t.id}>
                  {tenant.themeId === t.id ? 'Đang dùng' : 'Chọn'}
                </button>
              </form>
            ))}
          </div>
        </Card>

        <Card title='Footer "Powered by MKT"'>
          <form action={toggleHidePoweredByAction} className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="hide" defaultChecked={tenant.hidePoweredBy} disabled={!canHide} className="h-4 w-4" />
              Ẩn footer “Powered by MKT” {canHide ? '' : '(chỉ Pro)'}
            </label>
            <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">Lưu</button>
          </form>
        </Card>
      </div>
    );
  }, { adminOnly: true });
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
