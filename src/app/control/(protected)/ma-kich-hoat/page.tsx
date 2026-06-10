/**
 * Quản lý mã kích hoạt (CLAUDE.md Mục 14 PHA 2). Super Admin sinh mã -> khách mua MKT
 * nhập mã ở /kich-hoat để tự tạo tenant.
 */
import { dbAdmin } from '@/lib/db';
import { createActivationCodesAction, revokeActivationCodeAction } from '../../actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { active: 'Còn hiệu lực', used: 'Đã dùng', revoked: 'Đã thu hồi' };
const STATUS_CLASS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  used: 'bg-slate-200 text-slate-500',
  revoked: 'bg-red-100 text-red-700',
};

export default async function ActivationCodesPage() {
  const [codes, rootDomain] = await Promise.all([
    dbAdmin.activationCode.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    Promise.resolve(process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Mã kích hoạt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Khách mua MKT nhập mã tại <span className="font-medium">{rootDomain}/kich-hoat</span> để tự tạo website.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Sinh mã mới</h2>
        <form action={createActivationCodesAction} className="grid items-end gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gói cấp</label>
            <select name="planName" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Số lượng</label>
            <input type="number" name="quantity" min={1} max={100} defaultValue={1} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
            <input name="note" placeholder="vd: đợt KM tháng 6" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Sinh mã</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Mã</th>
              <th className="px-4 py-3 font-medium">Gói</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Tenant đã dùng</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {codes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có mã nào.</td></tr>
            )}
            {codes.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-medium text-slate-800">{c.code}</td>
                <td className="px-4 py-3">{c.planName}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[c.status] ?? ''}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.usedByTenantId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{c.createdAt.toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">
                  {c.status === 'active' && (
                    <form action={revokeActivationCodeAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Thu hồi</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
