import Link from 'next/link';
import { renderInThemeShell } from '@/lib/public-tenant';
import { loginCustomerAction } from '../../public-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đăng nhập' };

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; reset?: string };
}) {
  return renderInThemeShell(async () => (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-slate-800">Đăng nhập</h1>
        {searchParams.reset === 'sent' && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.
          </p>
        )}
        {searchParams.reset === 'done' && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Đặt lại mật khẩu thành công. Mời bạn đăng nhập.
          </p>
        )}
        {searchParams.error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}
        <form action={loginCustomerAction} className="mt-4 space-y-3">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <input name="password" type="password" required placeholder="Mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <button className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Đăng nhập</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/tai-khoan/dang-ky" className="text-[color:var(--brand)]">Đăng ký</Link>
          <Link href="/tai-khoan/quen-mat-khau" className="text-slate-500">Quên mật khẩu?</Link>
        </div>
      </div>
    </div>
  ));
}
