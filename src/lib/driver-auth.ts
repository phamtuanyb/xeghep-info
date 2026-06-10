/**
 * Bảo vệ cổng tài xế (/tai-xe) — CLAUDE.md Mục 12.C. Vai trò DRIVER, gắn tenantId.
 * Tenant context lấy từ session; hồ sơ Driver tra theo userId.
 */
import { getSession, type SessionPayload } from './auth';
import { runWithTenant } from './tenant-context';
import { db } from './db';
import { AuthError } from './rbac';

export type DriverSession = SessionPayload & { tenantId: string };

export async function getDriverSession(): Promise<DriverSession | null> {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== 'DRIVER') return null;
  return session as DriverSession;
}

/** Chạy action tài xế: kiểm role DRIVER -> tenant context -> kèm hồ sơ Driver. */
export async function withDriverAction<T>(
  fn: (ctx: { session: DriverSession; driver: { id: string } & Record<string, unknown> }) => Promise<T>
): Promise<T> {
  const session = await getDriverSession();
  if (!session) throw new AuthError(401, 'Bạn cần đăng nhập tài xế.');
  return runWithTenant(session.tenantId, async () => {
    const driver = await db.driver.findFirst({ where: { userId: session.userId } });
    if (!driver) throw new AuthError(404, 'Chưa có hồ sơ tài xế cho tài khoản này.');
    return fn({ session, driver: driver as { id: string } & Record<string, unknown> });
  });
}
