/**
 * Chi tiết chuyến + đặt chỗ (CLAUDE.md Mục 12.A): thông tin tài xế đã xác thực,
 * che biển số, chọn ghế, mã giảm giá (kiểm tra ở server khi gửi), tạo Booking +
 * Telegram + chuyển sang màn xác nhận.
 */
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { renderInThemeShell } from '@/lib/public-tenant';
import { can } from '@/lib/entitlement';
import { formatVnd, maskPlate } from '@/themes/shared';
import { createBookingAction } from '../../public-actions';

export const dynamic = 'force-dynamic';

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  return renderInThemeShell(async ({ tenant }) => {
    const trip = await db.trip.findUnique({
      where: { id: params.id },
      include: { route: true, driver: true },
    });
    if (!trip) notFound();

    const couponsEnabled = await can(tenant.id, 'coupons');
    const seatOptions = Array.from({ length: Math.max(1, trip.seatsLeft) }, (_, i) => i + 1);
    const driverVerified = trip.driver?.kycStatus === 'approved';

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Thông tin chuyến + tài xế */}
          <div className="space-y-4 md:col-span-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h1 className="font-heading text-2xl font-bold text-slate-800">
                {trip.route.fromName} → {trip.route.toName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Khởi hành: {new Date(trip.departAt).toLocaleString('vi-VN')}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>Còn {trip.seatsLeft}/{trip.seatsTotal} ghế</span>
                <span>Loại: {trip.serviceType}</span>
              </div>
              <div className="mt-4 text-2xl font-bold text-[color:var(--brand)]">
                {formatVnd(trip.pricePerSeat)} <span className="text-sm font-normal text-slate-400">/ ghế</span>
              </div>
            </div>

            {trip.driver && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-semibold text-slate-800">Tài xế</h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-400">
                    {trip.driver.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      {trip.driver.fullName}
                      {driverVerified && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Đã xác thực
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {trip.driver.carType ?? 'Xe'}
                      {trip.driver.carColor ? ` · ${trip.driver.carColor}` : ''} · {maskPlate(trip.driver.plateNumber)}
                    </div>
                    <div className="text-sm text-amber-500">★ {trip.driver.rating.toFixed(1)} · {trip.driver.tripCount} chuyến</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form đặt chỗ */}
          <div className="md:col-span-2">
            <div className="sticky top-20 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-800">Đặt chỗ</h2>
              {searchParams.error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
              )}
              <form action={createBookingAction} className="space-y-3">
                <input type="hidden" name="tripId" value={trip.id} />
                <input name="customerName" required placeholder="Họ và tên" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                <input name="customerPhone" required placeholder="Số điện thoại" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Số ghế</label>
                  <select name="seats" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                    {seatOptions.map((n) => (
                      <option key={n} value={n}>
                        {n} ghế
                      </option>
                    ))}
                  </select>
                </div>
                {couponsEnabled && (
                  <input name="couponCode" placeholder="Mã giảm giá (nếu có)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase" />
                )}
                <textarea name="note" rows={2} placeholder="Ghi chú (điểm đón, giờ…)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
                <button className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                  Gửi yêu cầu đặt chỗ
                </button>
                <p className="text-center text-xs text-slate-400">Không cần thanh toán trước. Tổng đài sẽ gọi xác nhận.</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  });
}
