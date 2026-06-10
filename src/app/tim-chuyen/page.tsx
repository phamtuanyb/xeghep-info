/**
 * Tìm chuyến (CLAUDE.md Mục 12.A): lọc theo điểm đi/đến/ngày; sắp xếp giờ sớm / giá
 * thấp / đánh giá cao. Không có chuyến phù hợp -> form "để lại thông tin" -> tạo
 * Booking lead + bắn Telegram. Render trong Shell của theme tenant.
 */
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { renderInThemeShell } from '@/lib/public-tenant';
import { formatVnd, maskPlate } from '@/themes/shared';
import type { Metadata } from 'next';
import { createLeadAction } from '../public-actions';
import { buildTenantMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata({ path: '/tim-chuyen', pageTitle: 'Tìm chuyến xe', pageDescription: 'Tìm và đặt chuyến xe ghép theo điểm đi, điểm đến và ngày khởi hành.' });
}

type SearchParams = {
  from?: string;
  to?: string;
  date?: string;
  sort?: string;
  sent?: string;
  error?: string;
};

const SORTS: { key: string; label: string }[] = [
  { key: 'time', label: 'Giờ đi sớm' },
  { key: 'price', label: 'Giá thấp' },
  { key: 'rating', label: 'Đánh giá cao' },
];

function buildOrderBy(sort?: string): Prisma.TripOrderByWithRelationInput {
  if (sort === 'price') return { pricePerSeat: 'asc' };
  if (sort === 'rating') return { driver: { rating: 'desc' } };
  return { departAt: 'asc' };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { from = '', to = '', date = '', sort = 'time' } = searchParams;

  return renderInThemeShell(async () => {
    const where: Prisma.TripWhereInput = { status: 'open' };
    const routeFilter: Prisma.RouteRelationFilter['is'] = {};
    if (from) routeFilter.fromName = { contains: from, mode: 'insensitive' };
    if (to) routeFilter.toName = { contains: to, mode: 'insensitive' };
    if (from || to) where.route = { is: routeFilter };
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      where.departAt = { gte: start, lt: end };
    }

    const trips = await db.trip.findMany({
      where,
      orderBy: buildOrderBy(sort),
      take: 50,
      include: {
        route: true,
        driver: { select: { fullName: true, plateNumber: true, rating: true, carType: true } },
      },
    });

    const qs = (next: Record<string, string>) => {
      const p = new URLSearchParams({ from, to, date, sort, ...next });
      return '/tim-chuyen?' + p.toString();
    };

    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-bold">Tìm chuyến xe</h1>

        {/* Bộ lọc */}
        <form method="get" className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input name="from" defaultValue={from} placeholder="Điểm đi" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input name="to" defaultValue={to} placeholder="Điểm đến" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input type="date" name="date" defaultValue={date} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <button className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Lọc</button>
        </form>

        {searchParams.sent === '1' && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Đã gửi thông tin. Tổng đài sẽ liên hệ với bạn sớm nhất.
          </p>
        )}
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{searchParams.error}</p>
        )}

        {/* Sắp xếp */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Sắp xếp:</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={qs({ sort: s.key })}
              className={`rounded-full px-3 py-1.5 ${sort === s.key ? 'bg-[var(--brand)] text-white' : 'bg-white text-slate-600 shadow-sm'}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Kết quả */}
        {trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/chuyen/${trip.id}`}
                className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {trip.route.fromName} → {trip.route.toName}
                  </div>
                  <div className="text-sm text-slate-500">
                    Khởi hành: {new Date(trip.departAt).toLocaleString('vi-VN')} · Còn {trip.seatsLeft}/{trip.seatsTotal} ghế
                  </div>
                  {trip.driver && (
                    <div className="text-sm text-slate-500">
                      Tài xế: {trip.driver.fullName} · {trip.driver.carType ?? 'Xe'} · {maskPlate(trip.driver.plateNumber)} · ★ {trip.driver.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[color:var(--brand)]">{formatVnd(trip.pricePerSeat)}</div>
                  <div className="text-xs text-slate-400">mỗi ghế</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800">Để lại thông tin đặt xe</h2>
            <p className="mt-1 text-sm text-slate-500">Điền thông tin, chúng tôi sẽ tìm xe và gọi lại xác nhận cho bạn.</p>
            <form action={createLeadAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <LeadField name="pickupAddr" label="Điểm đón" required defaultValue={from} placeholder="VD: 123 Nguyễn Trãi, Hà Nội" />
              <LeadField name="dropoffAddr" label="Trả khách" required defaultValue={to} placeholder="VD: TP. Yên Bái" />
              <LeadField name="customerName" label="Họ tên" required placeholder="Nguyễn Văn A" />
              <LeadField name="customerPhone" label="Số điện thoại" required placeholder="09xx xxx xxx" />
              <div>
                <label className="mb-1 block text-sm text-slate-600">Ngày đi</label>
                <input type="date" name="departDate" defaultValue={date} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              </div>
              <div className="flex items-end md:col-span-2">
                <button className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">Gửi thông tin</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  });
}

function LeadField({
  name,
  label,
  required,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />
    </div>
  );
}
