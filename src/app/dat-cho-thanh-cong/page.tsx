/**
 * Màn xác nhận đặt chỗ thành công (CLAUDE.md Mục 12.A). Đọc Booking theo id trong
 * tenant context (db cô lập) và hiển thị tóm tắt.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { renderInThemeShell } from '@/lib/public-tenant';
import { maskPhone } from '@/lib/mask';

export const dynamic = 'force-dynamic';

export default async function BookingSuccessPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id ?? '';

  return renderInThemeShell(async () => {
    const booking = id ? await db.booking.findUnique({ where: { id } }) : null;
    if (!booking) notFound();

    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="font-heading text-2xl font-bold text-slate-800">Đặt chỗ thành công!</h1>
        <p className="mt-2 text-slate-500">
          Cảm ơn bạn. Tổng đài sẽ gọi tới số {maskPhone(booking.customerPhone)} để xác nhận chuyến.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-5 text-left shadow-sm">
          <Row label="Khách hàng" value={booking.customerName} />
          {(booking.fromName || booking.toName) && (
            <Row label="Tuyến" value={`${booking.fromName ?? '?'} → ${booking.toName ?? '?'}`} />
          )}
          <Row label="Số ghế" value={String(booking.seats)} />
          {booking.couponCode && <Row label="Mã giảm giá" value={booking.couponCode} />}
          <Row label="Trạng thái" value="Đã tiếp nhận" />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600">
            Về trang chủ
          </Link>
          <Link href="/tim-chuyen" className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">
            Tìm chuyến khác
          </Link>
        </div>
      </div>
    );
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
