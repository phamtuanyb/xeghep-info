import { renderInThemeShell } from '@/lib/public-tenant';
import { resetPasswordAction } from '../../public-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đặt lại mật khẩu' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string };
}) {
  const token = searchParams.token ?? '';

  return renderInThemeShell(async () => (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-slate-800">Đặt lại mật khẩu</h1>
        {!token ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Liên kết không hợp lệ.</p>
        ) : (
          <>
            {searchParams.error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}
            <form action={resetPasswordAction} className="mt-4 space-y-3">
              <input type="hidden" name="token" value={token} />
              <input name="password" type="password" required placeholder="Mật khẩu mới (≥ 6 ký tự)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Đặt lại mật khẩu</button>
            </form>
          </>
        )}
      </div>
    </div>
  ));
}
