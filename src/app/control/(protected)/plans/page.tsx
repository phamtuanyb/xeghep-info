import { dbAdmin } from '@/lib/db';
import { updatePlanAction } from '../../actions';

export const dynamic = 'force-dynamic';

const FEATURE_LABELS: { key: string; label: string }[] = [
  { key: 'customDomain', label: 'Tên miền riêng' },
  { key: 'hidePoweredBy', label: 'Ẩn footer "Powered by MKT"' },
  { key: 'themeSelection', label: 'Chọn giao diện (theme)' },
  { key: 'driverSelfServe', label: 'Tài xế tự đăng chuyến' },
  { key: 'coupons', label: 'Mã giảm giá' },
  { key: 'reportsDetailed', label: 'Báo cáo chi tiết + CSV' },
  { key: 'seoFull', label: 'SEO / GA4 / Search Console đầy đủ' },
];

export default async function PlansPage() {
  const plans = await dbAdmin.plan.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Gói dịch vụ (Free / Pro)</h1>
      <p className="text-sm text-slate-500">
        Định nghĩa giới hạn và feature flag cho từng gói. -1 nghĩa là không giới hạn.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const features = (plan.features ?? {}) as Record<string, unknown>;
          return (
            <form
              key={plan.id}
              action={updatePlanAction}
              className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="planId" value={plan.id} />
              <h2 className="text-lg font-bold text-brand">{plan.name}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Số tuyến tối đa</label>
                  <input type="number" name="maxRoutes" defaultValue={plan.maxRoutes} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Số tài xế tối đa</label>
                  <input type="number" name="maxDrivers" defaultValue={plan.maxDrivers} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Giá/tháng (₫) — tính doanh thu Pro</label>
                  <input type="number" name="priceMonthly" min={0} defaultValue={plan.priceMonthly} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                {FEATURE_LABELS.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name={`feature_${f.key}`} defaultChecked={features[f.key] === true} className="h-4 w-4" />
                    {f.label}
                  </label>
                ))}
              </div>

              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Lưu gói {plan.name}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
