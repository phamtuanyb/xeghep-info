import Link from 'next/link';
import { renderInThemeShell } from '@/lib/public-tenant';
import { registerAction } from '../../public-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đăng ký tài khoản' };

export default async function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderInThemeShell(async () => (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-slate-800">Đăng ký tài khoản khách</h1>
        <p className="mt-1 text-sm text-slate-500">Tạo tài khoản để theo dõi “Chuyến của tôi”.</p>
        {searchParams.error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}
        <form action={registerAction} className="mt-4 space-y-3">
          <input name="fullName" required placeholder="Họ và tên" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input name="phone" placeholder="Số điện thoại (tùy chọn)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input name="password" type="password" required placeholder="Mật khẩu (≥ 6 ký tự)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <button className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Đăng ký</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Đã có tài khoản? <Link href="/tai-khoan/dang-nhap" className="font-semibold text-[color:var(--brand)]">Đăng nhập</Link>
        </p>
      </div>
    </div>
  ));
}
