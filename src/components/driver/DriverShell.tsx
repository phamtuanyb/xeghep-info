/** Khung cổng tài xế (CLAUDE.md Mục 12.C). */
import Link from 'next/link';
import { driverLogoutAction } from '@/app/tai-xe/actions';

const NAV = [
  { href: '/tai-xe', label: 'Tổng quan' },
  { href: '/tai-xe/kyc', label: 'Hồ sơ KYC' },
  { href: '/tai-xe/chuyen', label: 'Chuyến của tôi' },
  { href: '/tai-xe/dat-cho', label: 'Đặt chỗ' },
  { href: '/tai-xe/ho-so', label: 'Cá nhân' },
];

export default function DriverShell({
  tenant,
  driverName,
  children,
}: {
  tenant: { brandName: string };
  driverName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold text-brand">{tenant.brandName}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Tài xế · {driverName}</span>
          </div>
          <form action={driverLogoutAction}>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Đăng xuất</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
