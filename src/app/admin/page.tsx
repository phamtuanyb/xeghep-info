/**
 * Dashboard Tenant Admin (CLAUDE.md Mục 12.B): tổng chuyến, biểu đồ Ngày|Tuần|Tháng,
 * badge việc cần xử lý (lead mới, KYC chờ, khiếu nại mở).
 */
import Link from 'next/link';
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';

export const dynamic = 'force-dynamic';

type Granularity = 'day' | 'week' | 'month';

function bucketKey(d: Date, g: Granularity): string {
  if (g === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (g === 'week') {
    // tuần bắt đầu thứ Hai
    const tmp = new Date(d);
    const day = (tmp.getDay() + 6) % 7;
    tmp.setDate(tmp.getDate() - day);
    return `${tmp.getFullYear()}-${String(tmp.getMonth() + 1).padStart(2, '0')}-${String(tmp.getDate()).padStart(2, '0')}`;
  }
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function buildBuckets(g: Granularity): { key: string; label: string }[] {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  if (g === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: bucketKey(d, g), label: `${d.getMonth() + 1}/${d.getFullYear()}` });
    }
  } else if (g === 'week') {
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      out.push({ key: bucketKey(d, g), label: bucketKey(d, g).slice(5) });
    }
  } else {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push({ key: bucketKey(d, g), label: bucketKey(d, g) });
    }
  }
  return out;
}

export default async function AdminDashboard({ searchParams }: { searchParams: { g?: string; published?: string } }) {
  const g: Granularity = searchParams.g === 'week' ? 'week' : searchParams.g === 'month' ? 'month' : 'day';
  const justPublished = searchParams.published === '1';

  return renderAdmin(async () => {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const [totalTrips, newLeads, pendingKyc, openComplaints, bookings] = await Promise.all([
      db.trip.count(),
      db.booking.count({ where: { status: 'new' } }),
      db.driver.count({ where: { kycStatus: 'pending' } }),
      db.complaint.count({ where: { status: 'open' } }),
      db.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

    const buckets = buildBuckets(g);
    const counts = new Map(buckets.map((b) => [b.key, 0]));
    for (const b of bookings) {
      const key = bucketKey(b.createdAt, g);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const series = buckets.map((b) => ({ label: b.label, count: counts.get(b.key) ?? 0 }));
    const maxCount = Math.max(1, ...series.map((s) => s.count));

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Tổng quan</h1>

        {justPublished && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>🎉 Website đã được xuất bản và đang chạy trên subdomain của bạn.</span>
            <a href="/" target="_blank" className="rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white">Xem website</a>
          </div>
        )}

        {/* Việc cần xử lý */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tổng chuyến" value={totalTrips} href="/admin/chuyen" />
          <Stat label="Lead mới" value={newLeads} href="/admin/lead" badge={newLeads > 0} />
          <Stat label="KYC chờ duyệt" value={pendingKyc} href="/admin/tai-xe" badge={pendingKyc > 0} />
          <Stat label="Khiếu nại mở" value={openComplaints} href="/admin/khieu-nai" badge={openComplaints > 0} />
        </div>

        {/* Biểu đồ lượt đặt */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Lượt đặt theo thời gian</h2>
            <div className="flex gap-1 text-sm">
              {(['day', 'week', 'month'] as Granularity[]).map((opt) => (
                <Link
                  key={opt}
                  href={`/admin?g=${opt}`}
                  className={`rounded-lg px-3 py-1.5 ${g === opt ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {opt === 'day' ? 'Ngày' : opt === 'week' ? 'Tuần' : 'Tháng'}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {series.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold text-slate-600">{s.count || ''}</span>
                <div className="w-full rounded-t bg-brand/80" style={{ height: `${(s.count / maxCount) * 120}px` }} />
                <span className="text-[10px] text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  });
}

function Stat({ label, value, href, badge }: { label: string; value: number; href: string; badge?: boolean }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {badge && <span className="h-2 w-2 rounded-full bg-red-500" />}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </Link>
  );
}
