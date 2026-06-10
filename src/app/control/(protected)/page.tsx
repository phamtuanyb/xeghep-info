import Link from 'next/link';
import { dbAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default async function ControlDashboard() {
  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [total, active, locked, pending, freeCount, proCount, expiringSoon] = await Promise.all([
    dbAdmin.tenant.count(),
    dbAdmin.tenant.count({ where: { status: 'ACTIVE' } }),
    dbAdmin.tenant.count({ where: { status: 'LOCKED' } }),
    dbAdmin.tenant.count({ where: { status: 'PENDING' } }),
    dbAdmin.subscription.count({ where: { plan: { name: 'FREE' } } }),
    dbAdmin.subscription.count({ where: { plan: { name: 'PRO' } } }),
    dbAdmin.subscription.count({
      where: { plan: { name: 'PRO' }, expiresAt: { gte: now, lte: in30days } },
    }),
  ]);

  const activationRate = total > 0 ? Math.round((active / total) * 100) : 0;
  const conversionRate = total > 0 ? Math.round((proCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Tổng quan nền tảng</h1>
        <Link
          href="/control/tenants"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Quản lý người thuê
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tổng người thuê" value={total} />
        <Stat label="Đang hoạt động" value={active} hint={`Tỷ lệ kích hoạt ${activationRate}%`} />
        <Stat label="Đang khóa" value={locked} />
        <Stat label="Chờ kích hoạt" value={pending} />
        <Stat label="Gói Free" value={freeCount} />
        <Stat label="Gói Pro" value={proCount} hint={`Tỷ lệ Free→Pro ${conversionRate}%`} />
        <Stat label="Pro sắp hết hạn (30 ngày)" value={expiringSoon} />
        <Stat label="Tỷ lệ chuyển đổi Pro" value={`${conversionRate}%`} />
      </div>
    </div>
  );
}
