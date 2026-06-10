/**
 * Hồ sơ KYC tài xế (CLAUDE.md Mục 12.C): CCCD, GPLX, đăng kiểm, ảnh xe. Gửi -> chờ
 * admin duyệt (kycStatus = pending).
 */
import { renderDriver } from '@/lib/driver-render';
import { updateKycAction } from '../actions';

export const dynamic = 'force-dynamic';

const KYC_LABEL: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };

export default async function KycPage({ searchParams }: { searchParams: { submitted?: string } }) {
  return renderDriver(async ({ driver }) => (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Hồ sơ KYC</h1>

      {searchParams.submitted === '1' && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Đã gửi hồ sơ. Vui lòng chờ chủ xe duyệt.</p>
      )}
      <p className="text-sm text-slate-500">
        Trạng thái hiện tại: <strong>{KYC_LABEL[driver.kycStatus] ?? driver.kycStatus}</strong>
      </p>

      <form action={updateKycAction} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <Field name="cccdUrl" label="Ảnh CCCD (URL)" defaultValue={driver.cccdUrl ?? ''} />
        <Field name="licenseUrl" label="Ảnh GPLX (URL)" defaultValue={driver.licenseUrl ?? ''} />
        <Field name="registryUrl" label="Ảnh đăng kiểm (URL)" defaultValue={driver.registryUrl ?? ''} />
        <Field name="avatarUrl" label="Ảnh xe / đại diện (URL)" defaultValue={driver.avatarUrl ?? ''} />
        <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Gửi hồ sơ để duyệt</button>
        <p className="text-xs text-slate-400">Sau khi gửi, hồ sơ sẽ chuyển sang trạng thái “Chờ duyệt”.</p>
      </form>
    </div>
  ));
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      <input name={name} defaultValue={defaultValue} placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
