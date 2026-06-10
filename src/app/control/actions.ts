'use server';

/**
 * Server Actions của Control Plane (CLAUDE.md Mục 12.D).
 * MỌI action: kiểm tra SUPER_ADMIN ở server -> validate Zod -> thao tác qua dbAdmin
 * -> ghi PlatformAuditLog -> revalidate/redirect.
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbAdmin } from '@/lib/db';
import { hashPassword, verifyPlatformCredentials, setSessionCookie } from '@/lib/auth';
import { requireSuperAdmin, AuthError } from '@/lib/rbac';
import { logPlatform } from '@/lib/platform-audit';
import { generateActivationCodes } from '@/lib/activation';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// ---------------- Đăng nhập / Đăng xuất ----------------

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ email: z.string().email('Email không hợp lệ'), password: z.string().min(1, 'Nhập mật khẩu') })
    .safeParse({ email: str(formData, 'email'), password: str(formData, 'password') });

  if (!parsed.success) {
    redirect('/control/login?error=' + encodeURIComponent('Thông tin đăng nhập không hợp lệ.'));
  }

  const result = await verifyPlatformCredentials(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    redirect('/control/login?error=' + encodeURIComponent('Email hoặc mật khẩu không đúng.'));
  }

  await setSessionCookie(result.payload);
  await logPlatform(result.payload.userId, 'LOGIN', null, { email: parsed.data.email });
  redirect('/control');
}

export async function logoutAction(): Promise<void> {
  const { clearSessionCookie } = await import('@/lib/auth');
  clearSessionCookie();
  redirect('/control/login');
}

// ---------------- Quản lý tenant ----------------

export async function createTenantAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();

  const parsed = z
    .object({
      brandName: z.string().min(1, 'Nhập tên thương hiệu'),
      slug: z.string().regex(slugRegex, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
      planId: z.string().min(1),
      ownerEmail: z.string().email('Email chủ xe không hợp lệ'),
      ownerName: z.string().optional().default(''),
      ownerPassword: z.string().min(6, 'Mật khẩu chủ xe tối thiểu 6 ký tự'),
      hotline: z.string().optional().default(''),
    })
    .parse({
      brandName: str(formData, 'brandName'),
      slug: str(formData, 'slug'),
      planId: str(formData, 'planId'),
      ownerEmail: str(formData, 'ownerEmail'),
      ownerName: str(formData, 'ownerName'),
      ownerPassword: str(formData, 'ownerPassword'),
      hotline: str(formData, 'hotline'),
    });

  const existing = await dbAdmin.tenant.findUnique({ where: { slug: parsed.slug } });
  if (existing) {
    redirect('/control/tenants?error=' + encodeURIComponent('Slug đã tồn tại, chọn slug khác.'));
  }

  const plan = await dbAdmin.plan.findUnique({ where: { id: parsed.planId } });
  if (!plan) {
    redirect('/control/tenants?error=' + encodeURIComponent('Gói không hợp lệ.'));
  }
  const defaultTheme = await dbAdmin.theme.findUnique({ where: { key: 'default' } });

  const tenant = await dbAdmin.tenant.create({
    data: {
      brandName: parsed.brandName,
      slug: parsed.slug,
      status: 'ACTIVE',
      hotline: parsed.hotline || null,
      themeId: defaultTheme?.id ?? null,
      ownerName: parsed.ownerName || null,
      ownerEmail: parsed.ownerEmail,
      purchasedAt: new Date(),
      subscription: {
        create: {
          planId: plan!.id,
          expiresAt: plan!.name === 'PRO' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        },
      },
      users: {
        create: {
          email: parsed.ownerEmail,
          password: await hashPassword(parsed.ownerPassword),
          fullName: parsed.ownerName || `Chủ xe ${parsed.brandName}`,
          role: 'TENANT_ADMIN',
        },
      },
    },
  });

  await logPlatform(actor.userId, 'CREATE_TENANT', tenant.id, { slug: parsed.slug, plan: plan!.name });
  redirect(`/control/tenants/${tenant.id}`);
}

export async function setTenantStatusAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const status = str(formData, 'status') as 'ACTIVE' | 'LOCKED' | 'PENDING';
  if (!['ACTIVE', 'LOCKED', 'PENDING'].includes(status)) throw new AuthError(400, 'Trạng thái không hợp lệ.');

  await dbAdmin.tenant.update({ where: { id: tenantId }, data: { status } });
  const action = status === 'LOCKED' ? 'LOCK_TENANT' : status === 'ACTIVE' ? 'ACTIVATE_TENANT' : 'UNLOCK_TENANT';
  await logPlatform(actor.userId, action, tenantId, { status });
  revalidatePath(`/control/tenants/${tenantId}`);
  revalidatePath('/control/tenants');
}

export async function changePlanAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const planId = str(formData, 'planId');

  const plan = await dbAdmin.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AuthError(400, 'Gói không hợp lệ.');

  const expiresAt = plan.name === 'PRO' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
  await dbAdmin.subscription.upsert({
    where: { tenantId },
    update: { planId, expiresAt },
    create: { tenantId, planId, expiresAt },
  });
  await logPlatform(actor.userId, 'CHANGE_PLAN', tenantId, { plan: plan.name });
  revalidatePath(`/control/tenants/${tenantId}`);
}

export async function extendProAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const months = Math.max(1, Math.min(36, Number(str(formData, 'months')) || 12));

  const sub = await dbAdmin.subscription.findUnique({ where: { tenantId } });
  if (!sub) throw new AuthError(400, 'Tenant chưa có gói.');
  const base = sub.expiresAt && sub.expiresAt.getTime() > Date.now() ? sub.expiresAt : new Date();
  const expiresAt = new Date(base.getTime());
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await dbAdmin.subscription.update({ where: { tenantId }, data: { expiresAt } });
  await logPlatform(actor.userId, 'EXTEND_PRO', tenantId, { months, expiresAt: expiresAt.toISOString() });
  revalidatePath(`/control/tenants/${tenantId}`);
}

export async function resetOwnerPasswordAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const newPassword = str(formData, 'newPassword');
  if (newPassword.length < 6) throw new AuthError(400, 'Mật khẩu mới tối thiểu 6 ký tự.');

  const owner = await dbAdmin.user.findFirst({ where: { tenantId, role: 'TENANT_ADMIN' } });
  if (!owner) throw new AuthError(404, 'Không tìm thấy chủ xe.');

  await dbAdmin.user.update({ where: { id: owner.id }, data: { password: await hashPassword(newPassword) } });
  await logPlatform(actor.userId, 'RESET_OWNER_PASSWORD', tenantId);
  revalidatePath(`/control/tenants/${tenantId}`);
}

export async function impersonateAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');

  const owner = await dbAdmin.user.findFirst({ where: { tenantId, role: 'TENANT_ADMIN' } });
  if (!owner) throw new AuthError(404, 'Không tìm thấy chủ xe để đăng nhập thay.');

  await setSessionCookie({ userId: owner.id, role: owner.role, tenantId: owner.tenantId });
  await logPlatform(actor.userId, 'IMPERSONATE', tenantId, { targetUserId: owner.id });
  redirect('/admin'); // cổng Tenant Admin (xây ở M3)
}

export async function updateCrmAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const purchasedRaw = str(formData, 'purchasedAt');

  await dbAdmin.tenant.update({
    where: { id: tenantId },
    data: {
      ownerName: str(formData, 'ownerName') || null,
      ownerEmail: str(formData, 'ownerEmail') || null,
      ownerPhone: str(formData, 'ownerPhone') || null,
      purchasedAt: purchasedRaw ? new Date(purchasedRaw) : null,
      internalNotes: str(formData, 'internalNotes') || null,
    },
  });
  await logPlatform(actor.userId, 'UPDATE_CRM', tenantId);
  revalidatePath(`/control/tenants/${tenantId}`);
}

const FEATURE_KEYS = [
  'customDomain',
  'hidePoweredBy',
  'themeSelection',
  'driverSelfServe',
  'coupons',
  'reportsDetailed',
  'seoFull',
] as const;

/** Ghi đè feature theo tenant (CLAUDE.md Mục 12.D). Mỗi feature: 'default' | 'on' | 'off'. */
export async function updateFeatureOverridesAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');

  const overrides: Record<string, boolean> = {};
  for (const key of FEATURE_KEYS) {
    const v = str(formData, `ov_${key}`); // '', 'on', 'off'
    if (v === 'on') overrides[key] = true;
    else if (v === 'off') overrides[key] = false;
    // '' (theo gói) -> không thêm key
  }

  await dbAdmin.tenant.update({ where: { id: tenantId }, data: { featureOverrides: overrides } });
  await logPlatform(actor.userId, 'UPDATE_FEATURE_OVERRIDE', tenantId, { overrides });
  revalidatePath(`/control/tenants/${tenantId}`);
}

/** Thu phí Pro thủ công (CLAUDE.md Mục 12.D): ghi nhận khoản thu + (tùy chọn) gia hạn. */
export async function recordProPaymentAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const tenantId = str(formData, 'tenantId');
  const amount = Math.max(0, Math.round(Number(str(formData, 'amount')) || 0));
  const months = Math.max(0, Math.min(36, Number(str(formData, 'months')) || 0));
  const method = ['bank', 'cash', 'other'].includes(str(formData, 'method')) ? str(formData, 'method') : 'bank';
  const note = str(formData, 'note');

  if (amount <= 0) {
    redirect(`/control/tenants/${tenantId}?error=` + encodeURIComponent('Số tiền phải lớn hơn 0.'));
  }

  await dbAdmin.proPayment.create({
    data: { tenantId, amount, months, method, note: note || null, createdBy: actor.userId },
  });

  // Gia hạn kèm theo nếu nhập số tháng.
  if (months > 0) {
    const sub = await dbAdmin.subscription.findUnique({ where: { tenantId } });
    if (sub) {
      const base = sub.expiresAt && sub.expiresAt.getTime() > Date.now() ? sub.expiresAt : new Date();
      const expiresAt = new Date(base.getTime());
      expiresAt.setMonth(expiresAt.getMonth() + months);
      await dbAdmin.subscription.update({ where: { tenantId }, data: { expiresAt } });
    }
  }

  await logPlatform(actor.userId, 'RECORD_PRO_PAYMENT', tenantId, { amount, months, method });
  revalidatePath(`/control/tenants/${tenantId}`);
}

// ---------------- Quản lý gói ----------------

export async function updatePlanAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const planId = str(formData, 'planId');

  const features: Record<string, boolean> = {};
  for (const key of [
    'customDomain',
    'hidePoweredBy',
    'themeSelection',
    'driverSelfServe',
    'coupons',
    'reportsDetailed',
    'seoFull',
  ]) {
    features[key] = formData.get(`feature_${key}`) === 'on';
  }

  await dbAdmin.plan.update({
    where: { id: planId },
    data: {
      maxRoutes: Number(str(formData, 'maxRoutes')),
      maxDrivers: Number(str(formData, 'maxDrivers')),
      priceMonthly: Math.max(0, Math.round(Number(str(formData, 'priceMonthly')) || 0)),
      features,
    },
  });
  await logPlatform(actor.userId, 'UPDATE_PLAN', null, { planId });
  revalidatePath('/control/plans');
}

// ---------------- Mã kích hoạt (onboarding tự động) ----------------

export async function createActivationCodesAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const planName = str(formData, 'planName') === 'PRO' ? 'PRO' : 'FREE';
  const quantity = Math.max(1, Math.min(100, Number(str(formData, 'quantity')) || 1));
  const note = str(formData, 'note');

  await generateActivationCodes(planName, quantity, actor.userId, note || undefined);
  await logPlatform(actor.userId, 'CREATE_ACTIVATION_CODES', null, { planName, quantity });
  revalidatePath('/control/ma-kich-hoat');
}

export async function revokeActivationCodeAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = str(formData, 'id');
  const ac = await dbAdmin.activationCode.findUnique({ where: { id } });
  if (!ac) throw new AuthError(404, 'Không tìm thấy mã.');
  if (ac.status === 'used') throw new AuthError(400, 'Mã đã được sử dụng, không thể thu hồi.');

  await dbAdmin.activationCode.update({ where: { id }, data: { status: 'revoked' } });
  await logPlatform(actor.userId, 'REVOKE_ACTIVATION_CODE', null, { code: ac.code });
  revalidatePath('/control/ma-kich-hoat');
}

// ---------------- Kho giao diện (theme) ----------------

export async function upsertThemeAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const parsed = z
    .object({
      id: z.string().optional().default(''),
      key: z.string().regex(slugRegex, 'Key chỉ gồm chữ thường, số và gạch ngang'),
      name: z.string().min(1, 'Nhập tên giao diện'),
      minPlan: z.enum(['FREE', 'PRO']),
      isActive: z.boolean(),
    })
    .parse({
      id: str(formData, 'id'),
      key: str(formData, 'key'),
      name: str(formData, 'name'),
      minPlan: str(formData, 'minPlan') === 'PRO' ? 'PRO' : 'FREE',
      isActive: formData.get('isActive') === 'on',
    });

  if (parsed.id) {
    await dbAdmin.theme.update({
      where: { id: parsed.id },
      data: { key: parsed.key, name: parsed.name, minPlan: parsed.minPlan, isActive: parsed.isActive },
    });
  } else {
    await dbAdmin.theme.create({
      data: { key: parsed.key, name: parsed.name, minPlan: parsed.minPlan, isActive: parsed.isActive },
    });
  }
  await logPlatform(actor.userId, 'UPSERT_THEME', null, { key: parsed.key });
  revalidatePath('/control/themes');
}

export async function toggleThemeAction(formData: FormData): Promise<void> {
  const actor = await requireSuperAdmin();
  const themeId = str(formData, 'themeId');
  const theme = await dbAdmin.theme.findUnique({ where: { id: themeId } });
  if (!theme) throw new AuthError(404, 'Không tìm thấy giao diện.');

  await dbAdmin.theme.update({ where: { id: themeId }, data: { isActive: !theme.isActive } });
  await logPlatform(actor.userId, 'TOGGLE_THEME', null, { key: theme.key, isActive: !theme.isActive });
  revalidatePath('/control/themes');
}
