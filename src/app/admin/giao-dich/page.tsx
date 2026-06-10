/**
 * Giao dịch (CLAUDE.md Mục 12.B). Hoa hồng 12% TÍNH Ở SERVER khi lưu.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { DeleteButton, Card } from '@/components/admin/ui';
import { upsertTransactionAction, deleteTransactionAction } from '../actions';

export const dynamic = 'force-dynamic';

function vnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

export default async function TransactionsPage() {
  return renderAdmin(async () => {
    const [txns, drivers, sum] = await Promise.all([
      db.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      db.driver.findMany({ orderBy: { fullName: 'asc' } }),
      db.transaction.aggregate({ _sum: { amount: true, commission: true } }),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Giao dịch</h1>
          <span className="text-sm text-slate-500">
            Tổng: {vnd(sum._sum.amount ?? 0)} · Hoa hồng (12%): {vnd(sum._sum.commission ?? 0)}
          </span>
        </div>

        <Card title="Thêm giao dịch">
          <form action={upsertTransactionAction} className="grid items-end gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tài xế</label>
              <select name="driverId" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">— Không —</option>
                {drivers.map((d) => (<option key={d.id} value={d.id}>{d.fullName}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Số tiền (₫)</label>
              <input type="number" name="amount" min={0} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Trạng thái</label>
              <select name="status" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="pending">Chờ</option>
                <option value="paid">Đã thu</option>
              </select>
            </div>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Thêm</button>
          </form>
          <p className="mt-2 text-xs text-slate-400">Hoa hồng được hệ thống tự tính 12% khi lưu.</p>
        </Card>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Thời gian</th>
                <th className="px-3 py-3 font-medium">Số tiền</th>
                <th className="px-3 py-3 font-medium">Hoa hồng (12%)</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txns.length === 0 && (<tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Chưa có giao dịch.</td></tr>)}
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-3 text-slate-500">{t.createdAt.toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{vnd(t.amount)}</td>
                  <td className="px-3 py-3 text-slate-600">{vnd(t.commission)}</td>
                  <td className="px-3 py-3 text-slate-600">{t.status}</td>
                  <td className="px-3 py-3 text-right"><DeleteButton action={deleteTransactionAction} id={t.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
}
