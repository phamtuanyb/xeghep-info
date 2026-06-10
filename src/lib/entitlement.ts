/**
 * Hệ thống phân tầng gói — entitlement (CLAUDE.md Mục 10).
 *
 * MỌI giới hạn Free/Pro PHẢI kiểm tra ở SERVER qua các hàm dưới đây, không chỉ ẩn
 * nút ở client. Dùng `dbAdmin` + lọc tenantId tường minh (gating là thao tác lớp
 * nền tảng, không phụ thuộc tenant context).
 *
 * Quy tắc hết hạn: gói PRO đã quá `expiresAt` được coi như FREE (hạ cấp hiệu lực).
 */
import type { Plan } from '@prisma/client';
import { dbAdmin } from './db';

export type FeatureKey =
  | 'customDomain'
  | 'hidePoweredBy'
  | 'themeSelection'
  | 'driverSelfServe'
  | 'coupons'
  | 'reportsDetailed'
  | 'seoFull';

/** Lỗi vi phạm giới hạn gói — route handler bắt và trả 403 + thông báo tiếng Việt. */
export class EntitlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntitlementError';
  }
}

async function getFreePlanOrThrow(): Promise<Plan> {
  const free = await dbAdmin.plan.findUnique({ where: { name: 'FREE' } });
  if (!free) {
    throw new Error('Hệ thống chưa cấu hình gói FREE.');
  }
  return free;
}

/** Trả về gói có hiệu lực của tenant (PRO hết hạn -> FREE). */
export async function getPlan(tenantId: string): Promise<Plan> {
  const sub = await dbAdmin.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!sub) {
    // Chưa có subscription -> mặc định FREE (an toàn nhất).
    return getFreePlanOrThrow();
  }

  const expired = sub.plan.name === 'PRO' && sub.expiresAt != null && sub.expiresAt.getTime() < Date.now();
  if (expired) {
    return getFreePlanOrThrow();
  }

  return sub.plan;
}

/** Tenant có đang ở gói PRO hiệu lực không. */
export async function isPro(tenantId: string): Promise<boolean> {
  return (await getPlan(tenantId)).name === 'PRO';
}

/**
 * Kiểm tra một feature flag có bật không. Ưu tiên ghi đè theo tenant
 * (Tenant.featureOverrides) — nếu key tồn tại (boolean) thì override THẮNG gói;
 * ngược lại lấy theo feature mặc định của gói.
 */
export async function can(tenantId: string, feature: FeatureKey): Promise<boolean> {
  const [plan, tenant] = await Promise.all([
    getPlan(tenantId),
    dbAdmin.tenant.findUnique({ where: { id: tenantId }, select: { featureOverrides: true } }),
  ]);

  const overrides = (tenant?.featureOverrides ?? {}) as Record<string, unknown>;
  if (typeof overrides[feature] === 'boolean') {
    return overrides[feature] === true;
  }

  const features = (plan.features ?? {}) as Record<string, unknown>;
  return features[feature] === true;
}

/**
 * Chặn vượt giới hạn số tuyến / tài xế theo gói. maxRoutes/maxDrivers = -1 nghĩa là
 * không giới hạn. Gọi TRƯỚC khi tạo mới Route/Driver ở server.
 */
export async function assertWithinLimit(tenantId: string, resource: 'routes' | 'drivers'): Promise<void> {
  const plan = await getPlan(tenantId);
  const max = resource === 'routes' ? plan.maxRoutes : plan.maxDrivers;

  if (max < 0) return; // không giới hạn

  const current =
    resource === 'routes'
      ? await dbAdmin.route.count({ where: { tenantId } })
      : await dbAdmin.driver.count({ where: { tenantId } });

  if (current >= max) {
    const label = resource === 'routes' ? 'tuyến' : 'tài xế';
    throw new EntitlementError(
      `Gói hiện tại chỉ cho phép tối đa ${max} ${label}. Vui lòng nâng cấp lên Pro để thêm.`
    );
  }
}

/**
 * Chặn chọn giao diện vượt gói (CLAUDE.md Mục 11):
 *  - theme 'default': mọi gói đều được.
 *  - theme khác: yêu cầu feature themeSelection (Pro) + theme phải isActive + minPlan phù hợp.
 */
export async function assertCanSelectTheme(tenantId: string, themeId: string): Promise<void> {
  const theme = await dbAdmin.theme.findUnique({ where: { id: themeId } });
  if (!theme || !theme.isActive) {
    throw new EntitlementError('Giao diện không tồn tại hoặc đã bị tắt.');
  }

  if (theme.key === 'default') return;

  // Dùng can() để tôn trọng cả ghi đè feature theo tenant.
  const themeSelectionAllowed = await can(tenantId, 'themeSelection');
  if (!themeSelectionAllowed) {
    throw new EntitlementError('Chỉ gói Pro mới được chọn giao diện khác mặc định.');
  }
  const plan = await getPlan(tenantId);
  if (theme.minPlan === 'PRO' && plan.name !== 'PRO') {
    throw new EntitlementError('Giao diện này yêu cầu gói Pro.');
  }
}

/** Chặn ẩn footer "Powered by MKT" nếu không phải Pro (CLAUDE.md Mục 10). */
export async function assertCanHidePoweredBy(tenantId: string): Promise<void> {
  const allowed = await can(tenantId, 'hidePoweredBy');
  if (!allowed) {
    throw new EntitlementError('Chỉ gói Pro mới được ẩn footer "Powered by MKT".');
  }
}

/**
 * Quyết định có hiển thị footer "Powered by MKT" hay không (kiểm tra ở server khi render):
 *  - Free: LUÔN hiển thị (không cho tắt).
 *  - Pro: theo công tắc tenant.hidePoweredBy.
 */
export async function shouldShowPoweredBy(tenantId: string): Promise<boolean> {
  const allowed = await can(tenantId, 'hidePoweredBy');
  if (!allowed) return true; // Free: khóa hiển thị

  const tenant = await dbAdmin.tenant.findUnique({
    where: { id: tenantId },
    select: { hidePoweredBy: true },
  });
  return !(tenant?.hidePoweredBy ?? false);
}
