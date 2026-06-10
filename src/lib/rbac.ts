/**
 * RBAC (CLAUDE.md Mục 9 & 3.2). Mọi route handler kiểm tra quyền ở SERVER.
 * Các helper ném AuthError (có status) khi không đủ quyền — route handler bắt và
 * trả 401/403.
 */
import { getSession, type SessionPayload } from './auth';

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Yêu cầu đã đăng nhập. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError(401, 'Bạn cần đăng nhập để tiếp tục.');
  }
  return session;
}

/** Yêu cầu vai trò thuộc danh sách cho phép. */
export async function requireRole(...roles: string[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new AuthError(403, 'Bạn không có quyền thực hiện thao tác này.');
  }
  return session;
}

/** Chủ xe (toàn quyền trong tenant). */
export function requireTenantAdmin(): Promise<SessionPayload> {
  return requireRole('TENANT_ADMIN');
}

/** Điều hành viên hoặc chủ xe (quyền vận hành). */
export function requireTenantOperator(): Promise<SessionPayload> {
  return requireRole('TENANT_ADMIN', 'TENANT_OPERATOR');
}

/** Super Admin nền tảng (MKT) — thao tác xuyên tenant. */
export function requireSuperAdmin(): Promise<SessionPayload> {
  return requireRole('SUPER_ADMIN');
}
