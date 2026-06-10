/**
 * Wizard khởi tạo website (CLAUDE.md Mục 14 M4): chủ xe nhập thương hiệu, logo, màu,
 * hotline, vài tuyến phổ biến, chọn giao diện theo gói rồi bấm "Xuất bản" -> site công
 * khai chạy ngay trên subdomain. Mục tiêu: dùng được < 10 phút, không cần hỗ trợ.
 *
 * Trang này KHÔNG dùng renderAdmin (tránh vòng lặp redirect onboarding) — tự guard.
 */
import { redirect } from 'next/navigation';
import { dbAdmin } from '@/lib/db';
import { getAdminSession, isTenantAdmin } from '@/lib/admin-auth';
import { getAvailableThemes } from '@/lib/theme';
import { getPlan } from '@/lib/entitlement';
import { publishOnboardingAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Khởi tạo website' };

export default async function OnboardingWizard({ searchParams }: { searchParams: { error?: string } }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/dang-nhap');
  if (!isTenantAdmin(session!)) redirect('/admin'); // điều hành viên không khởi tạo

  const [tenant, themes, plan] = await Promise.all([
    dbAdmin.tenant.findUnique({ where: { id: session!.tenantId } }),
    getAvailableThemes(session!.tenantId),
    getPlan(session!.tenantId),
  ]);
  if (!tenant) redirect('/admin/dang-nhap');
  const rootDomain = process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn';

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-slate-800">Khởi tạo website của bạn</h1>
          <p className="mt-2 text-slate-500">Điền vài thông tin cơ bản và bấm “Xuất bản” — website sẽ chạy ngay trên <strong>{tenant.slug}.{rootDomain}</strong>.</p>
        </div>

        {searchParams.error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}

        <form action={publishOnboardingAction} className="space-y-6">
          {/* Bước 1: Thương hiệu */}
          <Section step={1} title="Thương hiệu">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="brandName" label="Tên thương hiệu *" defaultValue={tenant.brandName} required />
              <Field name="hotline" label="Hotline" defaultValue={tenant.hotline ?? ''} placeholder="0901234567" />
              <Field name="logoUrl" label="Logo (URL)" defaultValue={tenant.logoUrl ?? ''} placeholder="https://..." />
              <div>
                <label className="mb-1 block text-sm text-slate-600">Màu thương hiệu</label>
                <input type="color" name="primaryColor" defaultValue={tenant.primaryColor ?? '#1565C0'} className="h-10 w-20 rounded border border-slate-200" />
              </div>
            </div>
          </Section>

          {/* Bước 2: Tuyến phổ biến */}
          <Section step={2} title="Vài tuyến phổ biến đầu tiên">
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid gap-3 md:grid-cols-3">
                  <input name={`route_from_${i}`} placeholder={`Điểm đi ${i + 1}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input name={`route_to_${i}`} placeholder={`Điểm đến ${i + 1}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input name={`route_price_${i}`} type="number" placeholder="Giá từ (₫)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              ))}
              <p className="text-xs text-slate-400">Có thể bỏ trống — thêm tuyến sau trong mục “Tuyến”.</p>
            </div>
          </Section>

          {/* Bước 3: Giao diện */}
          <Section step={3} title="Chọn giao diện">
            <p className="mb-3 text-sm text-slate-500">
              Gói hiện tại: <strong>{plan.name}</strong>.{' '}
              {plan.name === 'PRO' ? 'Chọn 1 trong các giao diện bên dưới.' : 'Gói Free dùng giao diện mặc định.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t, idx) => {
                const checked = tenant.themeId ? tenant.themeId === t.id : idx === 0;
                return (
                  <label key={t.id} className="flex cursor-pointer items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 has-[:checked]:border-brand has-[:checked]:bg-blue-50">
                    <input type="radio" name="themeId" value={t.id} defaultChecked={checked} className="mt-1" />
                    <span>
                      <span className="block font-semibold text-slate-800">{t.name}</span>
                      <span className="block text-xs text-slate-400">{t.key} · tối thiểu {t.minPlan}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Xong! Bấm xuất bản để đưa website lên sóng.</p>
            <button className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90">🚀 Xuất bản website</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ name, label, defaultValue, required, placeholder }: { name: string; label: string; defaultValue?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      <input name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
    </div>
  );
}
