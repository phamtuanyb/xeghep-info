/**
 * Khung Tenant Admin (CLAUDE.md Mục 12.B). Ẩn mục Cài đặt/Mã giảm/Nội dung/Nhân viên
 * với TENANT_OPERATOR (chỉ vận hành).
 */
import Link from 'next/link';
import { adminLogoutAction } from '@/app/admin/actions';

type NavItem = { href: string; label: string; adminOnly?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Vận hành',
    items: [
      { href: '/admin', label: 'Tổng quan' },
      { href: '/admin/lead', label: 'Lead đặt xe' },
      { href: '/admin/tuyen', label: 'Tuyến' },
      { href: '/admin/chuyen', label: 'Chuyến' },
      { href: '/admin/tai-xe', label: 'Tài xế & KYC' },
      { href: '/admin/giao-dich', label: 'Giao dịch' },
      { href: '/admin/khieu-nai', label: 'Khiếu nại' },
      { href: '/admin/bao-cao', label: 'Báo cáo' },
    ],
  },
  {
    group: 'Nội dung & marketing',
    items: [
      { href: '/admin/noi-dung', label: 'CMS trang chủ', adminOnly: true },
      { href: '/admin/tin-tuc', label: 'Tin tức', adminOnly: true },
      { href: '/admin/ma-giam-gia', label: 'Mã giảm giá', adminOnly: true },
    ],
  },
  {
    group: 'Thiết lập',
    items: [
      { href: '/admin/giao-dien', label: 'Branding & giao diện', adminOnly: true },
      { href: '/admin/ten-mien', label: 'Tên miền riêng', adminOnly: true },
      { href: '/admin/cau-hinh', label: 'Cấu hình', adminOnly: true },
      { href: '/admin/nhan-vien', label: 'Nhân viên', adminOnly: true },
      { href: '/admin/audit', label: 'Nhật ký', adminOnly: true },
    ],
  },
];

export default function AdminShell({
  tenant,
  role,
  children,
}: {
  tenant: { brandName: string; slug: string };
  role: string;
  children: React.ReactNode;
}) {
  const isAdmin = role === 'TENANT_ADMIN';
  const roleLabel = isAdmin ? 'Chủ xe' : 'Điều hành viên';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold text-brand">{tenant.brandName}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Xem website
            </a>
            <form action={adminLogoutAction}>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-5">
            {NAV.map((section) => {
              const items = section.items.filter((it) => isAdmin || !it.adminOnly);
              if (items.length === 0) return null;
              return (
                <div key={section.group}>
                  <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{section.group}</div>
                  {items.map((it) => (
                    <Link key={it.href} href={it.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-brand">
                      {it.label}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Nav mobile */}
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 bg-white px-2 py-2 md:hidden">
        {NAV.flatMap((s) => s.items)
          .filter((it) => isAdmin || !it.adminOnly)
          .map((it) => (
            <Link key={it.href} href={it.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600">
              {it.label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
