import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { adminLoginAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đăng nhập quản trị' };

export default async function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getAdminSession()) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-xl font-bold text-slate-800">Quản trị website</h1>
        <p className="mb-6 text-sm text-slate-500">Dành cho chủ xe và điều hành viên.</p>
        {searchParams.error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}
        <form action={adminLoginAction} className="space-y-4">
          <input type="email" name="email" required placeholder="Email" autoComplete="username" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <input type="password" name="password" required placeholder="Mật khẩu" autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90">Đăng nhập</button>
        </form>
      </div>
    </main>
  );
}
