import Link from 'next/link';
import { requireControlSession } from '@/lib/control-auth';
import { logoutAction } from '../actions';

const NAV = [
  { href: '/control', label: 'Tổng quan' },
  { href: '/control/tenants', label: 'Người thuê' },
  { href: '/control/ma-kich-hoat', label: 'Mã kích hoạt' },
  { href: '/control/plans', label: 'Gói dịch vụ' },
  { href: '/control/themes', label: 'Kho giao diện' },
  { href: '/control/reports', label: 'Báo cáo' },
  { href: '/control/audit', label: 'Nhật ký' },
];

export default async function ControlLayout({ children }: { children: React.ReactNode }) {
  await requireControlSession();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-heading text-lg font-bold text-brand">Xe Ghép · Control Plane</span>
            <nav className="hidden gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Đăng xuất
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
