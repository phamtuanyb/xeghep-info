import Link from 'next/link';
import { dbAdmin } from '@/lib/db';
import { createTenantAction } from '../../actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đang khóa',
  PENDING: 'Chờ kích hoạt',
};
const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  LOCKED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

export default async function TenantsPage({ searchParams }: { searchParams: { error?: string; deleted?: string } }) {
  const [tenants, plans, rootDomain] = await Promise.all([
    dbAdmin.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: true } } },
    }),
    dbAdmin.plan.findMany({ orderBy: { name: 'asc' } }),
    Promise.resolve(process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn'),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Người thuê (tenant)</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
      )}
      {searchParams.deleted && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Đã xóa vĩnh viễn người thuê <strong>{searchParams.deleted}</strong> cùng toàn bộ dữ liệu liên quan.
        </p>
      )}

      {/* Tạo tenant mới */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Tạo người thuê mới</h2>
        <form action={createTenantAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Tên thương hiệu" name="brandName" required placeholder="Nhà xe An Bình" />
          <Field label={`Subdomain (.${rootDomain})`} name="slug" required placeholder="nha-xe-an-binh" />
          <Field label="Tên chủ xe" name="ownerName" placeholder="Nguyễn Văn A" />
          <Field label="Email chủ xe" name="ownerEmail" type="email" required placeholder="chuxe@email.vn" />
          <Field label="Mật khẩu khởi tạo" name="ownerPassword" type="password" required placeholder="tối thiểu 6 ký tự" />
          <Field label="Hotline" name="hotline" placeholder="0901234567" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gói khởi tạo</label>
            <select
              name="planId"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Tạo người thuê
            </button>
          </div>
        </form>
      </section>

      {/* Danh sách */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Thương hiệu</th>
              <th className="px-4 py-3 font-medium">Subdomain</th>
              <th className="px-4 py-3 font-medium">Gói</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Chưa có người thuê nào.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{t.brandName}</td>
                <td className="px-4 py-3 text-slate-500">
                  {t.slug}.{rootDomain}
                </td>
                <td className="px-4 py-3">{t.subscription?.plan.name ?? 'FREE'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {t.createdAt.toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/control/tenants/${t.id}`} className="font-medium text-brand hover:underline">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}
