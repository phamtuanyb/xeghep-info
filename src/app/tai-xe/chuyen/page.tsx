/**
 * Chuyến của tài xế (CLAUDE.md Mục 12.C).
 *  - FREE: chỉ xem (chủ xe thêm chuyến giúp).
 *  - PRO: tài xế tự đăng chuyến (gating `driverSelfServe` kiểm ở server khi tạo).
 */
import { db } from '@/lib/db';
import { renderDriver } from '@/lib/driver-render';
import { can } from '@/lib/entitlement';
import { createMyTripAction, deleteMyTripAction } from '../actions';

export const dynamic = 'force-dynamic';

const SERVICE_TYPES = [
  { v: 'ghep_1', l: 'Ghép 1' },
  { v: 'ghep_2', l: 'Ghép 2' },
  { v: 'bao_5', l: 'Bao xe 5' },
  { v: 'bao_7', l: 'Bao xe 7' },
  { v: 'gui_do', l: 'Gửi đồ' },
];

export default async function MyTripsPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderDriver(async ({ session, driver }) => {
    const [trips, routes, selfServe] = await Promise.all([
      db.trip.findMany({ where: { driverId: driver.id }, orderBy: { departAt: 'desc' }, include: { route: true } }),
      db.route.findMany({ orderBy: { fromName: 'asc' } }),
      can(session.tenantId, 'driverSelfServe'),
    ]);

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Chuyến của tôi</h1>
        {searchParams.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}

        {selfServe ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-800">Đăng chuyến mới</h2>
            <form action={createMyTripAction} className="grid items-end gap-3 md:grid-cols-3">
              <Lbl t="Tuyến">
                <select name="routeId" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">— Chọn tuyến —</option>
                  {routes.map((r) => (<option key={r.id} value={r.id}>{r.fromName} → {r.toName}</option>))}
                </select>
              </Lbl>
              <Lbl t="Dịch vụ">
                <select name="serviceType" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {SERVICE_TYPES.map((s) => (<option key={s.v} value={s.v}>{s.l}</option>))}
                </select>
              </Lbl>
              <Lbl t="Giờ khởi hành"><input type="datetime-local" name="departAt" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
              <Lbl t="Số ghế"><input type="number" name="seatsTotal" defaultValue={7} min={1} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
              <Lbl t="Giá/ghế (₫)"><input type="number" name="pricePerSeat" defaultValue={0} min={0} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Đăng chuyến</button>
            </form>
          </section>
        ) : (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Gói Free: chủ xe sẽ thêm chuyến giúp bạn. Bạn chỉ xem danh sách chuyến của mình.
          </p>
        )}

        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <div className="font-semibold text-slate-800">{t.route.fromName} → {t.route.toName}</div>
                <div className="text-sm text-slate-500">
                  {new Date(t.departAt).toLocaleString('vi-VN')} · Còn {t.seatsLeft}/{t.seatsTotal} ghế · {t.status === 'open' ? 'Đang mở' : 'Đóng'}
                </div>
              </div>
              {selfServe && (
                <form action={deleteMyTripAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Xóa</button>
                </form>
              )}
            </div>
          ))}
          {trips.length === 0 && <p className="text-center text-slate-400">Chưa có chuyến nào.</p>}
        </div>
      </div>
    );
  });
}

function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{t}</label>
      {children}
    </div>
  );
}
