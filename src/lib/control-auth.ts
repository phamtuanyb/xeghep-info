/**
 * Tiện ích bảo vệ Control Plane: chỉ SUPER_ADMIN mới vào được /control (CLAUDE.md Mục 3.2 & 12.D).
 */
import { redirect } from 'next/navigation';
import { getSession, type SessionPayload } from './auth';

/** Trả session nếu là SUPER_ADMIN, ngược lại null. */
export async function getControlSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') return null;
  return session;
}

/** Bắt buộc SUPER_ADMIN; nếu không -> chuyển về trang đăng nhập Control Plane. */
export async function requireControlSession(): Promise<SessionPayload> {
  const session = await getControlSession();
  if (!session) redirect('/control/login');
  return session;
}
