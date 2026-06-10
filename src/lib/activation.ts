/**
 * Mã kích hoạt — onboarding tự động (CLAUDE.md Mục 14 PHA 2).
 * Khách mua MKT nhập mã -> tự tạo tenant + subdomain (logic thuần, dễ test).
 * Bảng cấp nền tảng -> dùng dbAdmin.
 */
import { randomBytes } from 'node:crypto';
import type { PlanName } from '@prisma/client';
import { dbAdmin } from './db';
import { hashPassword } from './auth';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['www', 'control', 'admin', 'api', 'app', 'mail', 'static', 'cdn']);

/** Mã dạng XXXX-XXXX-XXXX (hex viết hoa). */
function randomCode(): string {
  const hex = randomBytes(6).toString('hex').toUpperCase(); // 12 ký tự
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/** Sinh `quantity` mã kích hoạt cho một gói. Trả danh sách mã. */
export async function generateActivationCodes(
  planName: PlanName,
  quantity: number,
  createdBy: string,
  note?: string
): Promise<string[]> {
  const qty = Math.max(1, Math.min(100, quantity));
  const codes: string[] = [];
  for (let i = 0; i < qty; i++) {
    let code = randomCode();
    // tránh trùng (xác suất cực thấp nhưng vẫn kiểm tra)
    while (await dbAdmin.activationCode.findUnique({ where: { code } })) code = randomCode();
    await dbAdmin.activationCode.create({ data: { code, planName, createdBy, note: note ?? null } });
    codes.push(code);
  }
  return codes;
}

export type RedeemInput = {
  code: string;
  brandName: string;
  slug: string;
  ownerName?: string;
  ownerEmail: string;
  ownerPassword: string;
};

export type RedeemResult = { ok: true; tenantId: string; slug: string } | { ok: false; error: string };

/**
 * Đổi mã kích hoạt thành tenant mới (subdomain = slug). Chạy trong transaction để
 * chống đổi mã 2 lần (race) và đảm bảo nguyên tử (tenant + admin + đánh dấu mã).
 * Tenant tạo ra ở trạng thái ACTIVE nhưng onboardedAt = null -> chủ xe vào wizard (M4).
 */
export async function redeemActivationCode(input: RedeemInput): Promise<RedeemResult> {
  const code = input.code.trim().toUpperCase();
  const slug = input.slug.trim().toLowerCase();
  const brandName = input.brandName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!code) return { ok: false, error: 'Vui lòng nhập mã kích hoạt.' };
  if (!brandName) return { ok: false, error: 'Vui lòng nhập tên thương hiệu.' };
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: 'Subdomain không hợp lệ (chỉ chữ thường, số, gạch ngang) hoặc đã được dành riêng.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return { ok: false, error: 'Email không hợp lệ.' };
  if (input.ownerPassword.length < 6) return { ok: false, error: 'Mật khẩu tối thiểu 6 ký tự.' };

  const passwordHash = await hashPassword(input.ownerPassword);

  try {
    const tenant = await dbAdmin.$transaction(async (tx) => {
      const ac = await tx.activationCode.findUnique({ where: { code } });
      if (!ac || ac.status !== 'active') throw new Error('CODE_INVALID');

      if (await tx.tenant.findUnique({ where: { slug } })) throw new Error('SLUG_TAKEN');

      const plan = await tx.plan.findUnique({ where: { name: ac.planName } });
      if (!plan) throw new Error('NO_PLAN');
      const defaultTheme = await tx.theme.findUnique({ where: { key: 'default' } });

      const created = await tx.tenant.create({
        data: {
          brandName,
          slug,
          status: 'ACTIVE',
          onboardedAt: null, // -> vào wizard khởi tạo
          themeId: defaultTheme?.id ?? null,
          ownerEmail,
          ownerName: input.ownerName?.trim() || null,
          purchasedAt: new Date(),
          subscription: {
            create: {
              planId: plan.id,
              expiresAt: plan.name === 'PRO' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
            },
          },
          users: {
            create: {
              email: ownerEmail,
              password: passwordHash,
              fullName: input.ownerName?.trim() || `Chủ xe ${brandName}`,
              role: 'TENANT_ADMIN',
            },
          },
        },
      });

      await tx.activationCode.update({
        where: { id: ac.id },
        data: { status: 'used', usedByTenantId: created.id, usedAt: new Date() },
      });

      return created;
    });

    return { ok: true, tenantId: tenant.id, slug };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'CODE_INVALID') return { ok: false, error: 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng.' };
    if (msg === 'SLUG_TAKEN') return { ok: false, error: 'Subdomain đã có người dùng. Vui lòng chọn tên khác.' };
    if (msg === 'NO_PLAN') return { ok: false, error: 'Hệ thống chưa cấu hình gói dịch vụ.' };
    return { ok: false, error: 'Không thể kích hoạt. Vui lòng thử lại.' };
  }
}
