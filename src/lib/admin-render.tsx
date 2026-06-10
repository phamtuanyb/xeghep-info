/**
 * Helper render trang Tenant Admin: guard session, dựng tenant context, bọc AdminShell.
 * `adminOnly` chặn TENANT_OPERATOR ở tầng trang (server). Mọi db trong build() chạy
 * trong tenant context của admin.
 */
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { dbAdmin } from './db';
import { runWithTenant } from './tenant-context';
import { getAdminSession, isTenantAdmin } from './admin-auth';
import type { SessionPayload } from './auth';
import AdminShell from '@/components/admin/AdminShell';

type AdminCtx = {
  session: SessionPayload & { tenantId: string };
  tenant: { id: string; brandName: string; slug: string };
};

export async function renderAdmin(
  build: (ctx: AdminCtx) => Promise<ReactNode>,
  opts: { adminOnly?: boolean } = {}
): Promise<ReactNode> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/dang-nhap');

  const tenant = await dbAdmin.tenant.findUnique({
    where: { id: session!.tenantId },
    select: { id: true, brandName: true, slug: true, onboardedAt: true },
  });
  if (!tenant) redirect('/admin/dang-nhap');

  // Lần đầu đăng nhập (chưa onboarding) -> đưa chủ xe vào wizard khởi tạo (Mục 14 M4).
  if (!tenant.onboardedAt && isTenantAdmin(session!)) redirect('/admin/khoi-tao');

  let content: ReactNode;
  if (opts.adminOnly && !isTenantAdmin(session!)) {
    content = (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Không có quyền truy cập</h2>
        <p className="mt-1 text-sm text-slate-500">Mục này chỉ dành cho chủ xe (Quản trị).</p>
      </div>
    );
  } else {
    content = await runWithTenant(session!.tenantId, () => build({ session: session!, tenant: tenant! }));
  }

  return (
    <AdminShell tenant={tenant!} role={session!.role}>
      {content}
    </AdminShell>
  );
}
