import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { renderInThemeShell } from '@/lib/public-tenant';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chuyến của tôi' };

const STATUS_LABEL: Record<string, string> = {
  new: 'Đã tiếp nhận',
  confirmed: 'Đã xác nhận',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default async function MyTripsPage() {
  return renderInThemeShell(async ({ tenant }) => {
    const session = await getSession();
    if (!session || session.role !== 'CUSTOMER' || session.tenantId !== tenant.id) {
      redirect('/tai-khoan/dang-nhap');
    }

    const bookings = await db.booking.findMany({
      where: { customerId: session!.userId },
      orderBy: { createdAt: 'desc' },
    });

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-slate-800">Chuyến của tôi</h1>
          <Link href="/tai-khoan/ho-so" className="text-sm text-[color:var(--brand)]">← Trang cá nhân</Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">Bạn chưa có chuyến nào.</p>
            <Link href="/tim-chuyen" className="mt-3 inline-block rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">
              Tìm chuyến ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800">
                    {b.fromName ?? '?'} → {b.toName ?? '?'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {b.departDate ? `Ngày đi: ${new Date(b.departDate).toLocaleDateString('vi-VN')}` : `${b.seats} ghế`}
                    {' · '}Đặt {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                    {b.couponCode ? ` · Mã: ${b.couponCode}` : ''}
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });
}
