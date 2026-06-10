import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbAdmin } from '@/lib/db';
import {
  setTenantStatusAction,
  changePlanAction,
  extendProAction,
  resetOwnerPasswordAction,
  impersonateAction,
  updateCrmAction,
  updateFeatureOverridesAction,
  recordProPaymentAction,
} from '../../../actions';

export const dynamic = 'force-dynamic';

const FEATURE_LABELS: { key: string; label: string }[] = [
  { key: 'customDomain', label: 'Tên miền riêng' },
  { key: 'hidePoweredBy', label: 'Ẩn footer "Powered by MKT"' },
  { key: 'themeSelection', label: 'Chọn giao diện' },
  { key: 'driverSelfServe', label: 'Tài xế tự đăng chuyến' },
  { key: 'coupons', label: 'Mã giảm giá' },
  { key: 'reportsDetailed', label: 'Báo cáo chi tiết + CSV' },
  { key: 'seoFull', label: 'SEO / GA4 đầy đủ' },
];

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—';
}
function dateInput(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : '';
}
function fmtVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const tenant = await dbAdmin.tenant.findUnique({
    where: { id: params.id },
    include: { subscription: { include: { plan: true } }, theme: true },
  });
  if (!tenant) notFound();

  const [plans, owner, upgradeLog, payments, paymentSum, rootDomain] = await Promise.all([
    dbAdmin.plan.findMany({ orderBy: { name: 'asc' } }),
    dbAdmin.user.findFirst({ where: { tenantId: tenant.id, role: 'TENANT_ADMIN' } }),
    dbAdmin.platformAuditLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    dbAdmin.proPayment.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    dbAdmin.proPayment.aggregate({ where: { tenantId: tenant.id }, _sum: { amount: true } }),
    Promise.resolve(process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn'),
  ]);

  const planName = tenant.subscription?.plan.name ?? 'FREE';
  const overrides = (tenant.featureOverrides ?? {}) as Record<string, unknown>;
  const totalPaid = paymentSum._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/control/tenants" className="text-sm text-slate-500 hover:underline">
          ← Người thuê
        </Link>
        <h1 className="font-heading text-2xl font-bold">{tenant.brandName}</h1>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{tenant.status}</span>
      </div>
      <p className="text-sm text-slate-500">
        {tenant.slug}.{rootDomain}
        {tenant.customDomain ? ` · ${tenant.customDomain}` : ''} · Gói {planName} · Hết hạn{' '}
        {fmtDate(tenant.subscription?.expiresAt)}
      </p>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trạng thái & gói */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Trạng thái & gói dịch vụ</h2>

          <div className="flex flex-wrap gap-2">
            <StatusButton tenantId={tenant.id} status="ACTIVE" label="Kích hoạt" />
            <StatusButton tenantId={tenant.id} status="LOCKED" label="Khóa site" />
            <StatusButton tenantId={tenant.id} status="PENDING" label="Chờ kích hoạt" />
          </div>

          <form action={changePlanAction} className="flex items-end gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Đổi gói</label>
              <select name="planId" defaultValue={tenant.subscription?.planId} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Lưu gói
            </button>
          </form>

          <form action={extendProAction} className="flex items-end gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Gia hạn Pro (tháng)</label>
              <input type="number" name="months" min={1} max={36} defaultValue={12} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50">
              Gia hạn
            </button>
          </form>
        </section>

        {/* Chủ xe: reset mật khẩu + impersonate */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Tài khoản chủ xe</h2>
          <p className="text-sm text-slate-500">{owner ? owner.email : 'Chưa có tài khoản chủ xe.'}</p>

          <form action={resetOwnerPasswordAction} className="flex items-end gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Đặt lại mật khẩu</label>
              <input type="text" name="newPassword" placeholder="Mật khẩu mới (≥ 6 ký tự)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Đặt lại
            </button>
          </form>

          <form action={impersonateAction}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Đăng nhập thay mặt (impersonate)
            </button>
          </form>
        </section>

        {/* CRM-lite */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold">Hồ sơ khách (CRM)</h2>
          <form action={updateCrmAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <CrmField label="Tên khách" name="ownerName" defaultValue={tenant.ownerName ?? ''} />
            <CrmField label="Email" name="ownerEmail" type="email" defaultValue={tenant.ownerEmail ?? ''} />
            <CrmField label="Số điện thoại" name="ownerPhone" defaultValue={tenant.ownerPhone ?? ''} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ngày mua MKT</label>
              <input type="date" name="purchasedAt" defaultValue={dateInput(tenant.purchasedAt)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú nội bộ</label>
              <textarea name="internalNotes" rows={3} defaultValue={tenant.internalNotes ?? ''} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Lưu hồ sơ
              </button>
            </div>
          </form>
        </section>

        {/* Ghi đè feature theo tenant */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold">Ghi đè feature theo tenant</h2>
          <p className="text-sm text-slate-500">
            &quot;Theo gói&quot; = dùng mặc định của gói. &quot;Bật&quot;/&quot;Tắt&quot; sẽ ghi đè riêng cho tenant này.
          </p>
          <form action={updateFeatureOverridesAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            {FEATURE_LABELS.map((f) => {
              const current =
                typeof overrides[f.key] === 'boolean' ? (overrides[f.key] ? 'on' : 'off') : '';
              return (
                <div key={f.key} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">{f.label}</span>
                  <select
                    name={`ov_${f.key}`}
                    defaultValue={current}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">Theo gói</option>
                    <option value="on">Bật</option>
                    <option value="off">Tắt</option>
                  </select>
                </div>
              );
            })}
            <div className="md:col-span-2">
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Lưu ghi đè
              </button>
            </div>
          </form>
        </section>

        {/* Thu phí Pro */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Thu phí Pro (thủ công)</h2>
            <span className="text-sm text-slate-500">Tổng đã thu: <strong>{fmtVnd(totalPaid)}</strong></span>
          </div>
          <form action={recordProPaymentAction} className="grid items-end gap-3 md:grid-cols-5">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền (₫)</label>
              <input type="number" name="amount" min={0} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức</label>
              <select name="method" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="bank">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Gia hạn (tháng)</label>
              <input type="number" name="months" min={0} max={36} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
              <input type="text" name="note" placeholder="Mã giao dịch, người nộp…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-5">
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Ghi nhận khoản thu
              </button>
            </div>
          </form>

          {payments.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-700">
                    {fmtVnd(p.amount)} · {p.method}
                    {p.months > 0 ? ` · +${p.months} tháng` : ''}
                    {p.note ? ` · ${p.note}` : ''}
                  </span>
                  <span className="text-slate-400">{p.createdAt.toLocaleString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lịch sử nâng cấp / log */}
        <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-semibold">Lịch sử nâng cấp & nhật ký</h2>
          {upgradeLog.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có hoạt động nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {upgradeLog.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2">
                  <span className="font-medium text-slate-700">{log.action}</span>
                  <span className="text-slate-400">{log.createdAt.toLocaleString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusButton({ tenantId, status, label }: { tenantId: string; status: string; label: string }) {
  return (
    <form action={setTenantStatusAction}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="status" value={status} />
      <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
        {label}
      </button>
    </form>
  );
}

function CrmField({
  label,
  name,
  type = 'text',
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input type={type} name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
}
