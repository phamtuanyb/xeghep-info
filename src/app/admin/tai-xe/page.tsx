/**
 * CRUD tài xế + duyệt KYC (CLAUDE.md Mục 12.B). Tạo mới áp giới hạn gói.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { getPlan } from '@/lib/entitlement';
import { AdminInput as In, DeleteButton, Card, FlashError } from '@/components/admin/ui';
import { upsertDriverAction, setKycStatusAction, deleteDriverAction, createDriverAccountAction } from '../actions';

export const dynamic = 'force-dynamic';

const KYC_LABEL: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const KYC_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default async function DriversPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderAdmin(async ({ session }) => {
    const [drivers, plan] = await Promise.all([
      db.driver.findMany({ orderBy: { fullName: 'asc' } }),
      getPlan(session.tenantId),
    ]);
    const limitLabel = plan.maxDrivers < 0 ? 'không giới hạn' : `${drivers.length}/${plan.maxDrivers}`;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Tài xế & KYC</h1>
          <span className="text-sm text-slate-500">Đã dùng: {limitLabel}</span>
        </div>

        <FlashError message={searchParams.error} />

        <Card title="Thêm tài xế">
          <form action={upsertDriverAction} className="grid items-end gap-3 md:grid-cols-3">
            <In name="fullName" label="Họ tên" required />
            <In name="carType" label="Loại xe" placeholder="Toyota Vios" />
            <In name="carColor" label="Màu xe" />
            <In name="plateNumber" label="Biển số" />
            <In name="avatarUrl" label="Ảnh đại diện (URL)" />
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Thêm tài xế</button>
          </form>
        </Card>

        <div className="space-y-3">
          {drivers.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{d.fullName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KYC_CLASS[d.kycStatus] ?? ''}`}>
                  KYC: {KYC_LABEL[d.kycStatus] ?? d.kycStatus}
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <form action={upsertDriverAction} className="grid flex-1 items-end gap-3 md:grid-cols-5">
                  <input type="hidden" name="id" value={d.id} />
                  <In name="fullName" label="Họ tên" defaultValue={d.fullName} />
                  <In name="carType" label="Loại xe" defaultValue={d.carType ?? ''} />
                  <In name="carColor" label="Màu" defaultValue={d.carColor ?? ''} />
                  <In name="plateNumber" label="Biển số" defaultValue={d.plateNumber ?? ''} />
                  <In name="avatarUrl" label="Avatar URL" defaultValue={d.avatarUrl ?? ''} />
                  <button className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">Lưu</button>
                </form>
                <div className="flex gap-2">
                  <KycButton id={d.id} status="approved" label="Duyệt" cls="bg-green-600 text-white" />
                  <KycButton id={d.id} status="rejected" label="Từ chối" cls="border border-red-200 text-red-600" />
                  <DeleteButton action={deleteDriverAction} id={d.id} />
                </div>
              </div>

              {/* Tài khoản đăng nhập cổng tài xế */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                {d.userId ? (
                  <p className="text-xs text-green-700">✓ Đã cấp tài khoản đăng nhập cổng tài xế.</p>
                ) : (
                  <form action={createDriverAccountAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="driverId" value={d.id} />
                    <In name="email" label="Email đăng nhập" type="email" required />
                    <In name="password" label="Mật khẩu" type="password" required />
                    <button className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">Cấp tài khoản tài xế</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {drivers.length === 0 && <p className="text-center text-slate-400">Chưa có tài xế nào.</p>}
        </div>
      </div>
    );
  });
}

function KycButton({ id, status, label, cls }: { id: string; status: string; label: string; cls: string }) {
  return (
    <form action={setKycStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kycStatus" value={status} />
      <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${cls}`}>{label}</button>
    </form>
  );
}
