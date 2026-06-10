import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { renderInThemeShell } from '@/lib/public-tenant';
import { updateProfileAction, changePasswordAction, logoutCustomerAction } from '../../public-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Trang cá nhân' };

export default async function ProfilePage({ searchParams }: { searchParams: { error?: string; updated?: string } }) {
  return renderInThemeShell(async ({ tenant }) => {
    const session = await getSession();
    if (!session || session.role !== 'CUSTOMER' || session.tenantId !== tenant.id) {
      redirect('/tai-khoan/dang-nhap');
    }
    const user = await db.user.findFirst({ where: { id: session!.userId } });
    if (!user) redirect('/tai-khoan/dang-nhap');

    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-slate-800">Trang cá nhân</h1>
          <div className="flex gap-2">
            <Link href="/tai-khoan/chuyen-cua-toi" className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white">
              Chuyến của tôi
            </Link>
            <form action={logoutCustomerAction}>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Đăng xuất</button>
            </form>
          </div>
        </div>

        {searchParams.updated === '1' && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Đã cập nhật thành công.</p>
        )}
        {searchParams.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}

        {/* Thông tin cá nhân */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Thông tin cá nhân</h2>
          <form action={updateProfileAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Email</label>
              <input value={user!.email} disabled className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Họ và tên</label>
              <input name="fullName" defaultValue={user!.fullName ?? ''} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Số điện thoại</label>
              <input name="phone" defaultValue={user!.phone ?? ''} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </div>
            <button className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">Lưu thông tin</button>
          </form>
        </section>

        {/* Đổi mật khẩu */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Đổi mật khẩu</h2>
          <form action={changePasswordAction} className="space-y-3">
            <input name="currentPassword" type="password" required placeholder="Mật khẩu hiện tại" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <input name="newPassword" type="password" required placeholder="Mật khẩu mới (≥ 6 ký tự)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <button className="rounded-xl border border-[color:var(--brand)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand)]">Đổi mật khẩu</button>
          </form>
        </section>
      </div>
    );
  });
}
