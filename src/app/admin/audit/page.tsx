/**
 * Nhật ký thao tác trong tenant (CLAUDE.md Mục 12.B). Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  return renderAdmin(async () => {
    const logs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    const actorIds = [...new Set(logs.map((l) => l.actorId))];
    const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, email: true } });
    const actorMap = new Map(actors.map((a) => [a.id, a.email]));

    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Nhật ký thao tác</h1>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Thời gian</th>
                <th className="px-3 py-3 font-medium">Người thực hiện</th>
                <th className="px-3 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (<tr><td colSpan={3} className="px-3 py-8 text-center text-slate-400">Chưa có nhật ký.</td></tr>)}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-3 text-slate-500">{l.createdAt.toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-3 text-slate-700">{actorMap.get(l.actorId) ?? l.actorId}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, { adminOnly: true });
}
