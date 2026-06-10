/**
 * Báo cáo doanh thu theo tài xế / tuyến (CLAUDE.md Mục 12.B) + xuất CSV (mở Excel
 * đúng tiếng Việt nhờ BOM UTF-8). Vận hành + Quản trị đều xem được.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';

export const dynamic = 'force-dynamic';

function vnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

export default async function ReportsPage() {
  return renderAdmin(async () => {
    const [byDriver, drivers, trips] = await Promise.all([
      db.transaction.groupBy({ by: ['driverId'], _sum: { amount: true, commission: true }, _count: { _all: true } }),
      db.driver.findMany({ select: { id: true, fullName: true } }),
      db.trip.findMany({ include: { route: true } }),
    ]);
    const driverName = new Map(drivers.map((d) => [d.id, d.fullName]));

    // Doanh thu ước tính theo tuyến: pricePerSeat * (ghế đã đặt).
    const routeAgg = new Map<string, { name: string; trips: number; seatsBooked: number; revenue: number }>();
    for (const t of trips) {
      const key = t.routeId;
      const cur = routeAgg.get(key) ?? { name: `${t.route.fromName} → ${t.route.toName}`, trips: 0, seatsBooked: 0, revenue: 0 };
      const booked = Math.max(0, t.seatsTotal - t.seatsLeft);
      cur.trips += 1;
      cur.seatsBooked += booked;
      cur.revenue += booked * t.pricePerSeat;
      routeAgg.set(key, cur);
    }

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Báo cáo</h1>

        {/* Theo tài xế */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Doanh thu theo tài xế</h2>
            <a href="/api/admin/reports?type=driver" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">Xuất CSV</a>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-2">Tài xế</th><th className="py-2">Số GD</th><th className="py-2">Doanh thu</th><th className="py-2">Hoa hồng</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byDriver.length === 0 && (<tr><td colSpan={4} className="py-4 text-center text-slate-400">Chưa có dữ liệu.</td></tr>)}
              {byDriver.map((r) => (
                <tr key={r.driverId ?? 'none'}>
                  <td className="py-2 font-medium text-slate-800">{r.driverId ? driverName.get(r.driverId) ?? '—' : 'Không gán'}</td>
                  <td className="py-2 text-slate-600">{r._count._all}</td>
                  <td className="py-2 text-slate-600">{vnd(r._sum.amount ?? 0)}</td>
                  <td className="py-2 text-slate-600">{vnd(r._sum.commission ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Theo tuyến */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Theo tuyến (ước tính)</h2>
            <a href="/api/admin/reports?type=route" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">Xuất CSV</a>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-2">Tuyến</th><th className="py-2">Số chuyến</th><th className="py-2">Ghế đã đặt</th><th className="py-2">Doanh thu ước tính</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeAgg.size === 0 && (<tr><td colSpan={4} className="py-4 text-center text-slate-400">Chưa có dữ liệu.</td></tr>)}
              {[...routeAgg.values()].map((r, i) => (
                <tr key={i}>
                  <td className="py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="py-2 text-slate-600">{r.trips}</td>
                  <td className="py-2 text-slate-600">{r.seatsBooked}</td>
                  <td className="py-2 text-slate-600">{vnd(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  });
}
