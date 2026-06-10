import { redirect } from 'next/navigation';
import { getControlSession } from '@/lib/control-auth';
import { loginAction } from '../actions';

export const metadata = { title: 'Đăng nhập Control Plane' };

export default async function ControlLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Đã đăng nhập SUPER_ADMIN -> vào thẳng dashboard.
  if (await getControlSession()) redirect('/control');

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-xl font-bold text-slate-800">Control Plane</h1>
        <p className="mb-6 text-sm text-slate-500">Khu quản trị nền tảng (MKT). Chỉ dành cho Super Admin.</p>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              placeholder="admin@xeghep-mkt.vn"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </main>
  );
}
