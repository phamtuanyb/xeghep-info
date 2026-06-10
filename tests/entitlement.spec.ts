/**
 * CỔNG TEST (CLAUDE.md Mục 15) — phân tầng gói (entitlement) kiểm tra ở SERVER.
 *
 * Chứng minh:
 *  - Free vượt giới hạn tuyến/tài xế -> bị chặn (assertWithinLimit ném lỗi).
 *  - Free chọn theme khác 'default' -> bị chặn (assertCanSelectTheme ném lỗi).
 *  - Free ẩn footer "Powered by MKT" -> bị chặn (assertCanHidePoweredBy ném lỗi).
 *  - Đối chứng Pro: không giới hạn, chọn được theme, ẩn được footer.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbAdmin } from '@/lib/db';
import {
  getPlan,
  can,
  isPro,
  assertWithinLimit,
  assertCanSelectTheme,
  assertCanHidePoweredBy,
  EntitlementError,
} from '@/lib/entitlement';

const RUN = `ent-${Date.now()}`;

let freePlanId: string;
let proPlanId: string;
let defaultThemeId: string;
let proThemeId: string;
let freeNonDefaultThemeId: string;
let freeTenantId: string;
let proTenantId: string;
let freeMaxRoutes: number;
let freeMaxDrivers: number;

const FREE_FEATURES = {
  customDomain: false,
  hidePoweredBy: false,
  themeSelection: false,
  driverSelfServe: false,
  coupons: false,
  reportsDetailed: false,
  seoFull: false,
};
const PRO_FEATURES = {
  customDomain: true,
  hidePoweredBy: true,
  themeSelection: true,
  driverSelfServe: true,
  coupons: true,
  reportsDetailed: true,
  seoFull: true,
};

beforeAll(async () => {
  // Plans (idempotent — giữ giá trị chuẩn để test ổn định).
  const free = await dbAdmin.plan.upsert({
    where: { name: 'FREE' },
    update: { maxRoutes: 5, maxDrivers: 3, features: FREE_FEATURES },
    create: { name: 'FREE', maxRoutes: 5, maxDrivers: 3, features: FREE_FEATURES },
  });
  const pro = await dbAdmin.plan.upsert({
    where: { name: 'PRO' },
    update: { maxRoutes: -1, maxDrivers: -1, features: PRO_FEATURES },
    create: { name: 'PRO', maxRoutes: -1, maxDrivers: -1, features: PRO_FEATURES },
  });
  freePlanId = free.id;
  proPlanId = pro.id;
  freeMaxRoutes = free.maxRoutes;
  freeMaxDrivers = free.maxDrivers;

  // Themes.
  const defaultTheme = await dbAdmin.theme.upsert({
    where: { key: 'default' },
    update: { isActive: true, minPlan: 'FREE' },
    create: { key: 'default', name: 'Giao diện mặc định', minPlan: 'FREE', isActive: true },
  });
  const proTheme = await dbAdmin.theme.upsert({
    where: { key: 'theme-a' },
    update: { isActive: true, minPlan: 'PRO' },
    create: { key: 'theme-a', name: 'Giao diện Năng động', minPlan: 'PRO', isActive: true },
  });
  defaultThemeId = defaultTheme.id;
  proThemeId = proTheme.id;

  // Theme khác 'default' nhưng minPlan FREE — để kiểm tra riêng cổng feature themeSelection
  // (độc lập với cổng tier minPlan).
  const freeNonDefault = await dbAdmin.theme.upsert({
    where: { key: 'theme-free-extra' },
    update: { isActive: true, minPlan: 'FREE' },
    create: { key: 'theme-free-extra', name: 'Giao diện Free mở rộng', minPlan: 'FREE', isActive: true },
  });
  freeNonDefaultThemeId = freeNonDefault.id;

  // Tenant FREE.
  const freeTenant = await dbAdmin.tenant.create({
    data: {
      brandName: 'Free Tenant',
      slug: `${RUN}-free`,
      status: 'ACTIVE',
      themeId: defaultThemeId,
      subscription: { create: { planId: freePlanId, expiresAt: null } },
    },
  });
  freeTenantId = freeTenant.id;

  // Tenant PRO.
  const proTenant = await dbAdmin.tenant.create({
    data: {
      brandName: 'Pro Tenant',
      slug: `${RUN}-pro`,
      status: 'ACTIVE',
      themeId: proThemeId,
      hidePoweredBy: true,
      subscription: { create: { planId: proPlanId, expiresAt: new Date('2030-01-01T00:00:00Z') } },
    },
  });
  proTenantId = proTenant.id;
});

afterAll(async () => {
  const ids = [freeTenantId, proTenantId].filter(Boolean);
  if (ids.length) {
    await dbAdmin.route.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.driver.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.subscription.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.tenant.deleteMany({ where: { id: { in: ids } } });
  }
  await dbAdmin.$disconnect();
});

describe('getPlan / can', () => {
  it('tenant Free trả gói FREE; tenant Pro trả gói PRO', async () => {
    expect((await getPlan(freeTenantId)).name).toBe('FREE');
    expect((await getPlan(proTenantId)).name).toBe('PRO');
    expect(await isPro(freeTenantId)).toBe(false);
    expect(await isPro(proTenantId)).toBe(true);
  });

  it('feature flag đúng theo gói', async () => {
    expect(await can(freeTenantId, 'coupons')).toBe(false);
    expect(await can(freeTenantId, 'themeSelection')).toBe(false);
    expect(await can(proTenantId, 'coupons')).toBe(true);
    expect(await can(proTenantId, 'hidePoweredBy')).toBe(true);
  });

  it('PRO hết hạn bị hạ về FREE', async () => {
    const expiredTenant = await dbAdmin.tenant.create({
      data: {
        brandName: 'Expired Pro',
        slug: `${RUN}-expired`,
        status: 'ACTIVE',
        subscription: { create: { planId: proPlanId, expiresAt: new Date('2020-01-01T00:00:00Z') } },
      },
    });
    expect((await getPlan(expiredTenant.id)).name).toBe('FREE');
    expect(await can(expiredTenant.id, 'coupons')).toBe(false);
    await dbAdmin.subscription.deleteMany({ where: { tenantId: expiredTenant.id } });
    await dbAdmin.tenant.delete({ where: { id: expiredTenant.id } });
  });
});

describe('assertWithinLimit — giới hạn tuyến/tài xế', () => {
  it('Free dưới giới hạn: không chặn', async () => {
    await dbAdmin.route.create({
      data: { tenantId: freeTenantId, fromName: 'A', toName: 'B', slug: 'r1', priceFrom: 1000 },
    });
    await expect(assertWithinLimit(freeTenantId, 'routes')).resolves.toBeUndefined();
  });

  it('Free vượt giới hạn TUYẾN: bị chặn', async () => {
    // Tạo cho đủ maxRoutes (đã có 1 ở test trên).
    const existing = await dbAdmin.route.count({ where: { tenantId: freeTenantId } });
    for (let i = existing; i < freeMaxRoutes; i++) {
      await dbAdmin.route.create({
        data: { tenantId: freeTenantId, fromName: 'A', toName: 'B', slug: `r-fill-${i}`, priceFrom: 1000 },
      });
    }
    await expect(assertWithinLimit(freeTenantId, 'routes')).rejects.toBeInstanceOf(EntitlementError);
  });

  it('Free vượt giới hạn TÀI XẾ: bị chặn', async () => {
    for (let i = 0; i < freeMaxDrivers; i++) {
      await dbAdmin.driver.create({
        data: { tenantId: freeTenantId, fullName: `TX ${i}`, plateNumber: `P-${i}` },
      });
    }
    await expect(assertWithinLimit(freeTenantId, 'drivers')).rejects.toBeInstanceOf(EntitlementError);
  });

  it('Pro KHÔNG giới hạn (maxRoutes = -1): không chặn dù nhiều', async () => {
    for (let i = 0; i < 10; i++) {
      await dbAdmin.route.create({
        data: { tenantId: proTenantId, fromName: 'A', toName: 'B', slug: `pro-r-${i}`, priceFrom: 1000 },
      });
    }
    await expect(assertWithinLimit(proTenantId, 'routes')).resolves.toBeUndefined();
  });
});

describe('assertCanSelectTheme — giao diện theo gói', () => {
  it('Free chọn theme khác default: bị chặn', async () => {
    await expect(assertCanSelectTheme(freeTenantId, proThemeId)).rejects.toBeInstanceOf(EntitlementError);
  });

  it('Free chọn theme default: được phép', async () => {
    await expect(assertCanSelectTheme(freeTenantId, defaultThemeId)).resolves.toBeUndefined();
  });

  it('Pro chọn theme Pro: được phép', async () => {
    await expect(assertCanSelectTheme(proTenantId, proThemeId)).resolves.toBeUndefined();
  });
});

describe('Ghi đè feature theo tenant (featureOverrides)', () => {
  it('override BẬT coupons cho tenant Free -> can() trả true (override thắng gói)', async () => {
    await dbAdmin.tenant.update({ where: { id: freeTenantId }, data: { featureOverrides: { coupons: true } } });
    expect(await can(freeTenantId, 'coupons')).toBe(true);
    // dọn override
    await dbAdmin.tenant.update({ where: { id: freeTenantId }, data: { featureOverrides: {} } });
    expect(await can(freeTenantId, 'coupons')).toBe(false);
  });

  it('override TẮT coupons cho tenant Pro -> can() trả false (override thắng gói)', async () => {
    await dbAdmin.tenant.update({ where: { id: proTenantId }, data: { featureOverrides: { coupons: false } } });
    expect(await can(proTenantId, 'coupons')).toBe(false);
    // dọn override
    await dbAdmin.tenant.update({ where: { id: proTenantId }, data: { featureOverrides: {} } });
    expect(await can(proTenantId, 'coupons')).toBe(true);
  });

  it('override themeSelection mở cổng feature; theme minPlan FREE thì chọn được, theme minPlan PRO vẫn chặn theo tier', async () => {
    // Chưa override: theme khác default bị chặn (themeSelection tắt theo gói Free).
    await expect(assertCanSelectTheme(freeTenantId, freeNonDefaultThemeId)).rejects.toBeInstanceOf(EntitlementError);

    // Override BẬT themeSelection: theme minPlan FREE -> được phép.
    await dbAdmin.tenant.update({ where: { id: freeTenantId }, data: { featureOverrides: { themeSelection: true } } });
    await expect(assertCanSelectTheme(freeTenantId, freeNonDefaultThemeId)).resolves.toBeUndefined();

    // Nhưng theme minPlan PRO vẫn bị chặn vì tier gói vẫn là FREE (cổng tier độc lập).
    await expect(assertCanSelectTheme(freeTenantId, proThemeId)).rejects.toBeInstanceOf(EntitlementError);

    await dbAdmin.tenant.update({ where: { id: freeTenantId }, data: { featureOverrides: {} } });
  });
});

describe('assertCanHidePoweredBy — footer Powered by MKT', () => {
  it('Free ẩn footer: bị chặn', async () => {
    await expect(assertCanHidePoweredBy(freeTenantId)).rejects.toBeInstanceOf(EntitlementError);
  });

  it('Pro ẩn footer: được phép', async () => {
    await expect(assertCanHidePoweredBy(proTenantId)).resolves.toBeUndefined();
  });
});
