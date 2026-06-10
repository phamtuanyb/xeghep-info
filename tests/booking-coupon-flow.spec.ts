/**
 * Integration test luồng nghiệp vụ công khai (CLAUDE.md Mục 12.A & 15):
 *  - Tạo lead/booking trong tenant context (cô lập tenant).
 *  - Mã giảm giá kiểm tra Ở SERVER: hợp lệ / hết hạn / vượt lượt / dưới đơn tối thiểu;
 *    mã của tenant khác KHÔNG áp được (cô lập).
 *  - Gating tính năng: coupons & driverSelfServe đúng theo gói.
 *
 * Bổ sung cho cổng test bắt buộc (tenant-isolation + entitlement).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, dbAdmin } from '@/lib/db';
import { runWithTenant } from '@/lib/tenant-context';
import { validateCoupon, consumeCoupon } from '@/lib/coupon';
import { can } from '@/lib/entitlement';

const RUN = `flow-${Date.now()}`;

function runAs<T>(tenantId: string, op: () => PromiseLike<T>): Promise<T> {
  return runWithTenant(tenantId, async () => await op());
}

let freeTenantId: string;
let proTenantId: string;

const FREE_FEATURES = { coupons: false, driverSelfServe: false };
const PRO_FEATURES = { coupons: true, driverSelfServe: true };

beforeAll(async () => {
  const free = await dbAdmin.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: { name: 'FREE', maxRoutes: 5, maxDrivers: 3, features: FREE_FEATURES },
  });
  const pro = await dbAdmin.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: { name: 'PRO', maxRoutes: -1, maxDrivers: -1, features: PRO_FEATURES },
  });

  const freeT = await dbAdmin.tenant.create({
    data: { brandName: 'Free Flow', slug: `${RUN}-free`, status: 'ACTIVE', subscription: { create: { planId: free.id } } },
  });
  const proT = await dbAdmin.tenant.create({
    data: {
      brandName: 'Pro Flow',
      slug: `${RUN}-pro`,
      status: 'ACTIVE',
      subscription: { create: { planId: pro.id, expiresAt: new Date('2030-01-01') } },
    },
  });
  freeTenantId = freeT.id;
  proTenantId = proT.id;

  // Mã giảm giá thuộc PRO tenant.
  await dbAdmin.coupon.create({
    data: { tenantId: proTenantId, code: 'GIAM10', type: 'percent', value: 10, minOrder: 100000, usageLimit: 2, isActive: true },
  });
  await dbAdmin.coupon.create({
    data: { tenantId: proTenantId, code: 'HETHAN', type: 'fixed', value: 50000, expiresAt: new Date('2020-01-01'), isActive: true },
  });
  // Mã của FREE tenant (để kiểm tra cô lập chéo tenant).
  await dbAdmin.coupon.create({
    data: { tenantId: freeTenantId, code: 'FREEONLY', type: 'fixed', value: 20000, isActive: true },
  });
});

afterAll(async () => {
  const ids = [freeTenantId, proTenantId].filter(Boolean);
  await dbAdmin.coupon.deleteMany({ where: { tenantId: { in: ids } } });
  await dbAdmin.booking.deleteMany({ where: { tenantId: { in: ids } } });
  await dbAdmin.subscription.deleteMany({ where: { tenantId: { in: ids } } });
  await dbAdmin.tenant.deleteMany({ where: { id: { in: ids } } });
  await dbAdmin.$disconnect();
  await db.$disconnect();
});

describe('Gating tính năng theo gói', () => {
  it('coupons: Free tắt, Pro bật', async () => {
    expect(await can(freeTenantId, 'coupons')).toBe(false);
    expect(await can(proTenantId, 'coupons')).toBe(true);
  });

  it('driverSelfServe: Free tắt, Pro bật', async () => {
    expect(await can(freeTenantId, 'driverSelfServe')).toBe(false);
    expect(await can(proTenantId, 'driverSelfServe')).toBe(true);
  });
});

describe('Mã giảm giá kiểm tra ở server', () => {
  it('mã hợp lệ percent: tính đúng số tiền giảm', async () => {
    const res = await runAs(proTenantId, () => validateCoupon('GIAM10', 200000));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.discount).toBe(20000); // 10% của 200k
      expect(res.finalAmount).toBe(180000);
    }
  });

  it('dưới đơn tối thiểu: bị từ chối', async () => {
    const res = await runAs(proTenantId, () => validateCoupon('GIAM10', 50000));
    expect(res.ok).toBe(false);
  });

  it('mã hết hạn: bị từ chối', async () => {
    const res = await runAs(proTenantId, () => validateCoupon('HETHAN', 200000));
    expect(res.ok).toBe(false);
  });

  it('hết lượt sử dụng: bị từ chối', async () => {
    // usageLimit = 2 -> dùng 2 lần rồi kiểm tra.
    await runAs(proTenantId, () => consumeCoupon('GIAM10'));
    await runAs(proTenantId, () => consumeCoupon('GIAM10'));
    const res = await runAs(proTenantId, () => validateCoupon('GIAM10', 200000));
    expect(res.ok).toBe(false);
  });

  it('mã của tenant khác KHÔNG áp được (cô lập)', async () => {
    // FREEONLY thuộc freeTenant; dưới context proTenant -> không tồn tại.
    const res = await runAs(proTenantId, () => validateCoupon('FREEONLY', 200000));
    expect(res.ok).toBe(false);
    // ngược lại, dưới context freeTenant thì thấy.
    const res2 = await runAs(freeTenantId, () => validateCoupon('FREEONLY', 200000));
    expect(res2.ok).toBe(true);
  });
});

describe('Tạo lead/booking cô lập tenant', () => {
  it('booking tạo dưới context A không lọt sang B', async () => {
    await runAs(freeTenantId, () =>
      db.booking.create({
        data: { tenantId: freeTenantId, customerName: 'Khách A', customerPhone: '0900000000', seats: 1, status: 'new' },
      })
    );

    const seenByFree = await runAs(freeTenantId, () => db.booking.count());
    const seenByPro = await runAs(proTenantId, () => db.booking.count());
    expect(seenByFree).toBeGreaterThanOrEqual(1);
    expect(seenByPro).toBe(0);
  });
});
