/**
 * Quản lý lead đặt xe (CLAUDE.md Mục 12.B) — Booking, hiển thị IP/thiết bị, đổi trạng thái.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { updateBookingStatusAction } from '../actions';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'confirmed', 'done', 'cancelled'];
const STATUS_LABEL: Record<string, string> = { new: 'Mới', confirmed: 'Đã xác nhận', done: 'Hoàn thành', cancelled: 'Đã hủy' };

export default async function LeadPage() {
  return renderAdmin(async () => {
    const bookings = await db.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });

    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Lead đặt xe</h1>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Thời gian</th>
                <th className="px-3 py-3 font-medium">Khách</th>
                <th className="px-3 py-3 font-medium">SĐT</th>
                <th className="px-3 py-3 font-medium">Điểm đón → Trả khách</th>
                <th className="px-3 py-3 font-medium">Ngày đi</th>
                <th className="px-3 py-3 font-medium">IP / Thiết bị</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">Chưa có lead nào.</td></tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} className="align-top hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-500">{b.createdAt.toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{b.customerName}</td>
                  <td className="px-3 py-3 text-slate-600">{b.customerPhone}</td>
                  <td className="px-3 py-3 text-slate-600">{(b.pickupAddr ?? b.fromName) ?? '?'} → {(b.dropoffAddr ?? b.toName) ?? '?'}</td>
                  <td className="px-3 py-3 text-slate-600">{b.departDate ? b.departDate.toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">
                    {b.ip ?? '—'}<br />
                    <span className="line-clamp-1 max-w-[180px]">{b.device ?? '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <form action={updateBookingStatusAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={b.id} />
                      <select name="status" defaultValue={b.status} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                        {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
                      </select>
                      <button className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white">Lưu</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
}
