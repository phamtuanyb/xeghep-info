/**
 * Auth (CLAUDE.md Mục 9): JWT trong cookie httpOnly + secure(prod) + sameSite,
 * mật khẩu băm bcrypt. Payload phiên: { userId, role, tenantId }.
 *
 * - verifyTenantCredentials: đăng nhập người dùng trong 1 tenant (chạy trong tenant
 *   context => db tự lọc tenant; KHÔNG đăng nhập chéo tenant được). Chặn tài khoản locked.
 * - verifyPlatformCredentials: đăng nhập Super Admin/Staff (lớp nền tảng, tenantId = null).
 */
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db, dbAdmin } from './db';

export const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export type SessionPayload = {
  userId: string;
  role: string;
  tenantId: string | null;
};

export type LoginResult =
  | { ok: true; payload: SessionPayload }
  | { ok: false; reason: 'invalid' | 'locked' };

// ---------- Mật khẩu ----------

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------- JWT ----------

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET phải có độ dài >= 32 ký tự ở môi trường production.');
    }
    // Dev/test: cảnh báo nhưng vẫn chạy được.
    return new TextEncoder().encode(secret ?? 'dev-insecure-jwt-secret-min-32-chars-aaaa');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role, tenantId: payload.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : null,
    };
  } catch {
    return null;
  }
}

// ---------- Cookie phiên ----------

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ---------- Đăng nhập ----------

/**
 * Đăng nhập người dùng tenant. PHẢI gọi trong runWithTenant(tenantId) — db tự lọc
 * theo tenant nên không thể đăng nhập bằng tài khoản của tenant khác.
 * Chặn tài khoản status = 'locked'.
 */
export async function verifyTenantCredentials(email: string, password: string): Promise<LoginResult> {
  const user = await db.user.findFirst({ where: { email } });
  if (!user) return { ok: false, reason: 'invalid' };
  if (user.status === 'locked') return { ok: false, reason: 'locked' };
  const valid = await verifyPassword(password, user.password);
  if (!valid) return { ok: false, reason: 'invalid' };
  return { ok: true, payload: { userId: user.id, role: user.role, tenantId: user.tenantId } };
}

// ---------- Token đặt lại mật khẩu (quên mật khẩu) ----------

export async function signResetToken(userId: string, tenantId: string): Promise<string> {
  return new SignJWT({ userId, tenantId, purpose: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getJwtSecret());
}

export async function verifyResetToken(
  token: string
): Promise<{ userId: string; tenantId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.purpose !== 'reset' || typeof payload.userId !== 'string' || typeof payload.tenantId !== 'string') {
      return null;
    }
    return { userId: payload.userId, tenantId: payload.tenantId };
  } catch {
    return null;
  }
}

/** Đăng nhập Super Admin / Platform Staff (lớp nền tảng). */
export async function verifyPlatformCredentials(email: string, password: string): Promise<LoginResult> {
  const user = await dbAdmin.platformUser.findUnique({ where: { email } });
  if (!user) return { ok: false, reason: 'invalid' };
  const valid = await verifyPassword(password, user.password);
  if (!valid) return { ok: false, reason: 'invalid' };
  return { ok: true, payload: { userId: user.id, role: user.role, tenantId: null } };
}
