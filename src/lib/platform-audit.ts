/**
 * Nhật ký nền tảng (CLAUDE.md Mục 12.D) — ghi PlatformAuditLog cho mọi thao tác
 * Control Plane (tạo/khóa/đổi gói/gia hạn/reset/impersonate...).
 */
import type { Prisma } from '@prisma/client';
import { dbAdmin } from './db';

export type PlatformAction =
  | 'CREATE_TENANT'
  | 'LOCK_TENANT'
  | 'UNLOCK_TENANT'
  | 'ACTIVATE_TENANT'
  | 'CHANGE_PLAN'
  | 'EXTEND_PRO'
  | 'RESET_OWNER_PASSWORD'
  | 'IMPERSONATE'
  | 'UPDATE_CRM'
  | 'UPDATE_FEATURE_OVERRIDE'
  | 'RECORD_PRO_PAYMENT'
  | 'UPSERT_THEME'
  | 'TOGGLE_THEME'
  | 'UPDATE_PLAN'
  | 'CREATE_ACTIVATION_CODES'
  | 'REVOKE_ACTIVATION_CODE'
  | 'LOGIN';

export async function logPlatform(
  actorId: string,
  action: PlatformAction,
  tenantId?: string | null,
  meta?: Prisma.InputJsonValue
): Promise<void> {
  await dbAdmin.platformAuditLog.create({
    data: { actorId, action, tenantId: tenantId ?? null, meta: meta ?? undefined },
  });
}
