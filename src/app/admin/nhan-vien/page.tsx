/**
 * Quản lý nhân viên (CLAUDE.md Mục 12.B): tạo, nâng/hạ quyền, khóa/mở. Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { Card, FlashError } from '@/components/admin/ui';
import { createStaffAction, updateStaffRoleAction, setStaffStatusAction } from '../actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = { TENANT_ADMIN: 'Quản trị', TENANT_OPERATOR: 'Điều hành viên' };

export default async function StaffPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderAdmin(async ({ session }) => {
    const staff = await db.user.findMany({
      where: { role: { in: ['TENANT_ADMIN', 'TENANT_OPERATOR'] } },
      orderBy: { createdAt: 'asc' },
    });

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Nhân viên</h1>
        <FlashError message={searchParams.error} />

        <Card title="Thêm nhân viên">
          <form action={createStaffAction} className="grid items-end gap-3 md:grid-cols-4">
            <In name="email" label="Email" type="email" required />
            <In name="fullName" label="Họ tên" />
            <In name="password" label="Mật khẩu" type="password" required />
            <div>
              <label className="mb-1 block text-xs text-slate-500">Vai trò</label>
              <select name="role" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="TENANT_OPERATOR">Điều hành viên</option>
                <option value="TENANT_ADMIN">Quản trị</option>
              </select>
            </div>
            <div className="md:col-span-4"><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Thêm nhân viên</button></div>
          </form>
        </Card>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Họ tên</th>
                <th className="px-3 py-3 font-medium">Vai trò</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((u) => {
                const isSelf = u.id === session.userId;
                return (
                  <tr key={u.id}>
                    <td className="px-3 py-3 font-medium text-slate-800">{u.email}</td>
                    <td className="px-3 py-3 text-slate-600">{u.fullName ?? '—'}</td>
                    <td className="px-3 py-3">{ROLE_LABEL[u.role]}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === 'locked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.status === 'locked' ? 'Khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate-400">(bạn)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <form action={updateStaffRoleAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="role" value={u.role === 'TENANT_ADMIN' ? 'TENANT_OPERATOR' : 'TENANT_ADMIN'} />
                            <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600">
                              {u.role === 'TENANT_ADMIN' ? 'Hạ xuống ĐH' : 'Nâng lên QT'}
                            </button>
                          </form>
                          <form action={setStaffStatusAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="status" value={u.status === 'locked' ? 'active' : 'locked'} />
                            <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600">
                              {u.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, { adminOnly: true });
}

function In({ name, label, type = 'text', required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input name={name} type={type} required={required} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
