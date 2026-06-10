import { dbAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const logs = await dbAdmin.platformAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Map actorId -> email (gọn cho danh sách nhỏ).
  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await dbAdmin.platformUser.findMany({ where: { id: { in: actorIds } } });
  const actorMap = new Map(actors.map((a) => [a.id, a.email]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Nhật ký nền tảng</h1>
      <p className="text-sm text-slate-500">100 hoạt động gần nhất của Super Admin/Staff.</p>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Người thực hiện</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Chưa có nhật ký.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-slate-500">{log.createdAt.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-slate-700">{actorMap.get(log.actorId) ?? log.actorId}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{log.action}</td>
                <td className="px-4 py-3 text-slate-500">{log.tenantId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
