/**
 * CRUD chuyến (CLAUDE.md Mục 12.B): gán tài xế, giá, ghế, giờ, dịch vụ.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { DeleteButton, Card } from '@/components/admin/ui';
import { upsertTripAction, deleteTripAction } from '../actions';

export const dynamic = 'force-dynamic';

const SERVICE_TYPES = [
  { v: 'ghep_1', l: 'Ghép 1' },
  { v: 'ghep_2', l: 'Ghép 2' },
  { v: 'bao_5', l: 'Bao xe 5' },
  { v: 'bao_7', l: 'Bao xe 7' },
  { v: 'gui_do', l: 'Gửi đồ' },
];

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function TripsPage() {
  return renderAdmin(async () => {
    const [trips, routes, drivers] = await Promise.all([
      db.trip.findMany({ orderBy: { departAt: 'desc' }, take: 100, include: { route: true, driver: true } }),
      db.route.findMany({ orderBy: { fromName: 'asc' } }),
      db.driver.findMany({ orderBy: { fullName: 'asc' } }),
    ]);

    const RouteSelect = ({ value }: { value?: string }) => (
      <select name="routeId" defaultValue={value} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">— Chọn tuyến —</option>
        {routes.map((r) => (<option key={r.id} value={r.id}>{r.fromName} → {r.toName}</option>))}
      </select>
    );
    const DriverSelect = ({ value }: { value?: string | null }) => (
      <select name="driverId" defaultValue={value ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">— Chưa gán —</option>
        {drivers.map((d) => (<option key={d.id} value={d.id}>{d.fullName}</option>))}
      </select>
    );
    const ServiceSelect = ({ value }: { value?: string }) => (
      <select name="serviceType" defaultValue={value ?? 'ghep_1'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        {SERVICE_TYPES.map((s) => (<option key={s.v} value={s.v}>{s.l}</option>))}
      </select>
    );

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Chuyến</h1>

        <Card title="Thêm chuyến">
          <form action={upsertTripAction} className="grid items-end gap-3 md:grid-cols-3">
            <Lbl t="Tuyến"><RouteSelect /></Lbl>
            <Lbl t="Tài xế"><DriverSelect /></Lbl>
            <Lbl t="Dịch vụ"><ServiceSelect /></Lbl>
            <Lbl t="Giờ khởi hành"><input type="datetime-local" name="departAt" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
            <Lbl t="Tổng ghế"><input type="number" name="seatsTotal" defaultValue={7} min={1} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
            <Lbl t="Ghế trống"><input type="number" name="seatsLeft" defaultValue={7} min={0} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
            <Lbl t="Giá/ghế (₫)"><input type="number" name="pricePerSeat" defaultValue={0} min={0} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
            <div className="md:col-span-3"><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Thêm chuyến</button></div>
          </form>
        </Card>

        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.id} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <form action={upsertTripAction} className="grid flex-1 items-end gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={t.id} />
                <Lbl t="Tuyến"><RouteSelect value={t.routeId} /></Lbl>
                <Lbl t="Tài xế"><DriverSelect value={t.driverId} /></Lbl>
                <Lbl t="Dịch vụ"><ServiceSelect value={t.serviceType} /></Lbl>
                <Lbl t="Giờ"><input type="datetime-local" name="departAt" defaultValue={toLocalInput(t.departAt)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
                <Lbl t="Tổng ghế"><input type="number" name="seatsTotal" defaultValue={t.seatsTotal} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
                <Lbl t="Ghế trống"><input type="number" name="seatsLeft" defaultValue={t.seatsLeft} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
                <Lbl t="Giá/ghế"><input type="number" name="pricePerSeat" defaultValue={t.pricePerSeat} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Lbl>
                <Lbl t="Trạng thái">
                  <select name="status" defaultValue={t.status} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="open">Mở</option>
                    <option value="closed">Đóng</option>
                  </select>
                </Lbl>
                <div className="md:col-span-4"><button className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">Lưu</button></div>
              </form>
              <DeleteButton action={deleteTripAction} id={t.id} />
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
