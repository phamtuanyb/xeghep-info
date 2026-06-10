/**
 * Landing chi tiết tài xế (CLAUDE.md Mục 12.A): hồ sơ đã xác thực, che biển số,
 * đánh giá. Render trong Shell theme tenant.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { renderInThemeShell } from '@/lib/public-tenant';
import { maskPlate } from '@/lib/mask';

export const dynamic = 'force-dynamic';

export default async function DriverDetailPage({ params }: { params: { id: string } }) {
  return renderInThemeShell(async () => {
    const driver = await db.driver.findUnique({ where: { id: params.id } });
    if (!driver || driver.kycStatus !== 'approved') notFound();

    const [reviews, openTrips] = await Promise.all([
      db.review.findMany({ where: { driverId: driver.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      db.trip.findMany({
        where: { driverId: driver.id, status: 'open' },
        orderBy: { departAt: 'asc' },
        take: 5,
        include: { route: true },
      }),
    ]);

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-400">
              {driver.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-slate-800">{driver.fullName}</h1>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ Đã xác thực</span>
              </div>
              <p className="mt-1 text-slate-500">
                {driver.carType ?? 'Xe'}
                {driver.carColor ? ` · ${driver.carColor}` : ''} · {maskPlate(driver.plateNumber)}
              </p>
              <p className="mt-1 text-amber-500">★ {driver.rating.toFixed(1)} · {driver.tripCount} chuyến</p>
            </div>
          </div>
        </div>

        {openTrips.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 font-semibold text-slate-800">Chuyến đang mở</h2>
            <div className="space-y-2">
              {openTrips.map((t) => (
                <Link key={t.id} href={`/chuyen/${t.id}`} className="block rounded-xl bg-white p-4 text-sm shadow-sm hover:shadow-md">
                  <span className="font-medium text-slate-800">{t.route.fromName} → {t.route.toName}</span>
                  <span className="ml-2 text-slate-500">{new Date(t.departAt).toLocaleString('vi-VN')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-800">Đánh giá từ khách</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có đánh giá.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-amber-500">{'★'.repeat(Math.max(1, Math.min(5, r.rating)))}</div>
                  {r.content && <p className="mt-1 text-sm text-slate-600">{r.content}</p>}
                  <p className="mt-1 text-xs text-slate-400">{r.authorName ?? 'Khách hàng'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  });
}
