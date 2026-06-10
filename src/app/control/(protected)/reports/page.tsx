import { dbAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

function fmtVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

/** Gom số tenant tạo theo 6 tháng gần nhất (YYYY-MM). */
function growthByMonth(dates: Date[]): { label: string; count: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, 0);
  }
  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
}

export default async function ReportsPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, proCount, freeCount, active, locked, revenueAll, revenueMonth, tenantDates] =
    await Promise.all([
      dbAdmin.tenant.count(),
      dbAdmin.subscription.count({ where: { plan: { name: 'PRO' } } }),
      dbAdmin.subscription.count({ where: { plan: { name: 'FREE' } } }),
      dbAdmin.tenant.count({ where: { status: 'ACTIVE' } }),
      dbAdmin.tenant.count({ where: { status: 'LOCKED' } }),
      dbAdmin.proPayment.aggregate({ _sum: { amount: true } }),
      dbAdmin.proPayment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth } } }),
      dbAdmin.tenant.findMany({ select: { createdAt: true } }),
    ]);

  const conversion = total > 0 ? Math.round((proCount / total) * 100) : 0;
  const growth = growthByMonth(tenantDates.map((t) => t.createdAt));
  const maxGrowth = Math.max(1, ...growth.map((g) => g.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Báo cáo nền tảng</h1>
        <a
          href="/api/control/reports/tenants"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Xuất CSV người thuê
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Tổng người thuê" value={total} />
        <Card label="Đang hoạt động" value={active} />
        <Card label="Đang khóa" value={locked} />
        <Card label="Tỷ lệ chuyển đổi Pro" value={`${conversion}%`} />
        <Card label="Gói Free" value={freeCount} />
        <Card label="Gói Pro" value={proCount} />
        <Card label="Doanh thu Pro (tất cả)" value={fmtVnd(revenueAll._sum.amount ?? 0)} />
        <Card label="Doanh thu Pro (tháng này)" value={fmtVnd(revenueMonth._sum.amount ?? 0)} />
      </div>

      {/* Tăng trưởng tenant 6 tháng */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Tăng trưởng người thuê (6 tháng gần nhất)</h2>
        <div className="flex items-end gap-4">
          {growth.map((g) => (
            <div key={g.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t bg-brand/80"
                  style={{ height: `${(g.count / maxGrowth) * 100}%` }}
                  title={`${g.count} tenant`}
                />
              </div>
              <span className="text-xs text-slate-500">{g.label}</span>
              <span className="text-xs font-semibold text-slate-700">{g.count}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-slate-400">
        File CSV xuất ra có BOM UTF-8 để Excel hiển thị đúng tiếng Việt có dấu.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
