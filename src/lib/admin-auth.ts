/**
 * Bảo vệ Tenant Admin (/admin) — CLAUDE.md Mục 3.2, 9, 12.B.
 *  - TENANT_ADMIN: toàn quyền trong tenant.
 *  - TENANT_OPERATOR: chỉ vận hành (không Cài đặt/Mã giảm/Nội dung/Nhân viên).
 *
 * Tenant context của admin lấy từ SESSION (session.tenantId) — admin chỉ thao tác
 * trên tenant của chính mình. withAdminAction bọc logic trong runWithTenant + ghi
 * AuditLog dễ dàng.
 */
import { getSession, type SessionPayload } from './auth';
import { runWithTenant, getTenantIdOrThrow } from './tenant-context';
import { db } from './db';
import { AuthError } from './rbac';

const ADMIN_ROLES = ['TENANT_ADMIN', 'TENANT_OPERATOR'];

/** Session nếu là nhân sự tenant (admin/operator) có tenantId, ngược lại null. */
export async function getAdminSession(): Promise<(SessionPayload & { tenantId: string }) | null> {
  const session = await getSession();
  if (!session || !session.tenantId || !ADMIN_ROLES.includes(session.role)) return null;
  return session as SessionPayload & { tenantId: string };
}

export function isTenantAdmin(session: SessionPayload): boolean {
  return session.role === 'TENANT_ADMIN';
}

/**
 * Chạy một server action quản trị: kiểm tra role ở SERVER, rồi chạy trong tenant
 * context của chính admin đó. `adminOnly` = chỉ TENANT_ADMIN.
 */
export async function withAdminAction<T>(
  opts: { adminOnly?: boolean },
  fn: (ctx: { session: SessionPayload & { tenantId: string } }) => Promise<T>
): Promise<T> {
  const session = await getAdminSession();
  if (!session) throw new AuthError(401, 'Bạn cần đăng nhập quản trị.');
  if (opts.adminOnly && !isTenantAdmin(session)) {
    throw new AuthError(403, 'Chỉ chủ xe (Quản trị) mới được thực hiện thao tác này.');
  }
  return runWithTenant(session.tenantId, () => fn({ session }));
}

/** Ghi nhật ký thao tác trong tenant (gọi BÊN TRONG tenant context). */
export async function logAudit(actorId: string, action: string, meta?: Record<string, unknown>): Promise<void> {
  await db.auditLog.create({
    data: { tenantId: getTenantIdOrThrow(), actorId, action, meta: meta ?? undefined },
  });
}
