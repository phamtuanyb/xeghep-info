import Link from 'next/link';
import { renderInThemeShell } from '@/lib/public-tenant';
import { forgotPasswordAction } from '../../public-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quên mật khẩu' };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderInThemeShell(async () => (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-slate-800">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-500">Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
        {searchParams.error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}
        <form action={forgotPasswordAction} className="mt-4 space-y-3">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <button className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Gửi liên kết</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/tai-khoan/dang-nhap" className="text-[color:var(--brand)]">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  ));
}
