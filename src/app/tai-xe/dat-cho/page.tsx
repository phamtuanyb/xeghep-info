/**
 * Đặt chỗ trên các chuyến của tài xế (CLAUDE.md Mục 12.C). Tài xế xem để liên hệ khách.
 */
import { db } from '@/lib/db';
import { renderDriver } from '@/lib/driver-render';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { new: 'Mới', confirmed: 'Đã xác nhận', done: 'Hoàn thành', cancelled: 'Đã hủy' };

export default async function DriverBookingsPage() {
  return renderDriver(async ({ driver }) => {
    const bookings = await db.booking.findMany({
      where: { trip: { driverId: driver.id } },
      orderBy: { createdAt: 'desc' },
      include: { trip: { include: { route: true } } },
      take: 200,
    });

    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Đặt chỗ</h1>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Thời gian</th>
                <th className="px-3 py-3 font-medium">Khách</th>
                <th className="px-3 py-3 font-medium">SĐT</th>
                <th className="px-3 py-3 font-medium">Tuyến</th>
                <th className="px-3 py-3 font-medium">Ghế</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 && (<tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Chưa có đặt chỗ nào.</td></tr>)}
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-3 text-slate-500">{b.createdAt.toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{b.customerName}</td>
                  <td className="px-3 py-3 text-slate-600">{b.customerPhone}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {b.trip ? `${b.trip.route.fromName} → ${b.trip.route.toName}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{b.seats}</td>
                  <td className="px-3 py-3 text-slate-600">{STATUS_LABEL[b.status] ?? b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
}
