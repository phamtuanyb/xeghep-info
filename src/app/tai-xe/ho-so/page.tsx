/**
 * Trang cá nhân tài xế (CLAUDE.md Mục 12.C): cập nhật thông tin + đổi mật khẩu.
 */
import { renderDriver } from '@/lib/driver-render';
import { updateDriverProfileAction, changeDriverPasswordAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage({ searchParams }: { searchParams: { updated?: string; error?: string } }) {
  return renderDriver(async ({ driver }) => (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Trang cá nhân</h1>

      {searchParams.updated === '1' && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Đã cập nhật.</p>}
      {searchParams.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Thông tin</h2>
        <form action={updateDriverProfileAction} className="grid gap-3 md:grid-cols-2">
          <Field name="fullName" label="Họ tên" defaultValue={driver.fullName} />
          <Field name="carType" label="Loại xe" defaultValue={driver.carType ?? ''} />
          <Field name="carColor" label="Màu xe" defaultValue={driver.carColor ?? ''} />
          <Field name="plateNumber" label="Biển số" defaultValue={driver.plateNumber ?? ''} />
          <div className="md:col-span-2"><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu thông tin</button></div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Đổi mật khẩu</h2>
        <form action={changeDriverPasswordAction} className="space-y-3">
          <input name="currentPassword" type="password" required placeholder="Mật khẩu hiện tại" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="newPassword" type="password" required placeholder="Mật khẩu mới (≥ 6 ký tự)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand">Đổi mật khẩu</button>
        </form>
      </section>
    </div>
  ));
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
