/**
 * Khiếu nại (CLAUDE.md Mục 12.B) — đổi trạng thái + tùy chọn hoàn tiền.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { updateComplaintAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ComplaintsPage() {
  return renderAdmin(async () => {
    const complaints = await db.complaint.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Khiếu nại</h1>

        {complaints.length === 0 ? (
          <p className="text-center text-slate-400">Chưa có khiếu nại nào.</p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{c.createdAt.toLocaleString('vi-VN')}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {c.status === 'open' ? 'Đang mở' : 'Đã xử lý'}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{c.content}</p>
                <form action={updateComplaintAction} className="mt-3 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="id" value={c.id} />
                  <select name="status" defaultValue={c.status} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                    <option value="open">Đang mở</option>
                    <option value="resolved">Đã xử lý</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="refunded" defaultChecked={c.refunded} className="h-4 w-4" /> Đã hoàn tiền
                  </label>
                  <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">Cập nhật</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });
}
