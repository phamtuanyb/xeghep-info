/**
 * Dashboard tài xế (CLAUDE.md Mục 12.C): tổng quan hồ sơ, trạng thái KYC, số chuyến,
 * số đặt chỗ.
 */
import Link from 'next/link';
import { db } from '@/lib/db';
import { renderDriver } from '@/lib/driver-render';
import { can } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';

const KYC_LABEL: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };
const KYC_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default async function DriverDashboard() {
  return renderDriver(async ({ session, driver }) => {
    const [tripCount, openTrips, bookingCount, selfServe] = await Promise.all([
      db.trip.count({ where: { driverId: driver.id } }),
      db.trip.count({ where: { driverId: driver.id, status: 'open' } }),
      db.booking.count({ where: { trip: { driverId: driver.id } } }),
      can(session.tenantId, 'driverSelfServe'),
    ]);

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Xin chào, {driver.fullName}</h1>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Trạng thái hồ sơ KYC</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${KYC_CLASS[driver.kycStatus] ?? ''}`}>
              {KYC_LABEL[driver.kycStatus] ?? driver.kycStatus}
            </span>
          </div>
          {driver.kycStatus !== 'approved' && (
            <Link href="/tai-xe/kyc" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
              Cập nhật hồ sơ KYC
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Chuyến của tôi" value={tripCount} href="/tai-xe/chuyen" />
          <Stat label="Chuyến đang mở" value={openTrips} href="/tai-xe/chuyen" />
          <Stat label="Lượt đặt chỗ" value={bookingCount} href="/tai-xe/dat-cho" />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Tự đăng chuyến</h2>
          {selfServe ? (
            <p className="mt-1 text-sm text-slate-500">
              Gói Pro: bạn có thể <Link href="/tai-xe/chuyen" className="font-semibold text-brand">tự đăng chuyến</Link>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Gói Free: chủ xe sẽ thêm chuyến giúp bạn. Liên hệ chủ xe để mở thêm chuyến.</p>
          )}
        </div>
      </div>
    );
  });
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </Link>
  );
}
