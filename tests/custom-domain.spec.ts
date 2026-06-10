/**
 * Test tự cấu hình tên miền riêng cho gói Pro (CLAUDE.md Mục 14 PHA 2).
 * Gating ở SERVER: Free không đặt được; Pro đặt được; định dạng/trùng được kiểm tra.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbAdmin } from '@/lib/db';
import { setCustomDomain, verifyCustomDomain } from '@/lib/custom-domain';

const RUN = `dom-${Date.now()}`;
let freeTenantId: string;
let proTenantId: string;
let otherProTenantId: string;

beforeAll(async () => {
  const free = await dbAdmin.plan.upsert({
    where: { name: 'FREE' },
    update: { features: { customDomain: false } },
    create: { name: 'FREE', maxRoutes: 5, maxDrivers: 3, features: { customDomain: false } },
  });
  const pro = await dbAdmin.plan.upsert({
    where: { name: 'PRO' },
    update: { features: { customDomain: true } },
    create: { name: 'PRO', maxRoutes: -1, maxDrivers: -1, features: { customDomain: true } },
  });

  const mk = async (slug: string, planId: string) =>
    (await dbAdmin.tenant.create({
      data: { brandName: slug, slug, status: 'ACTIVE', subscription: { create: { planId } } },
    })).id;

  freeTenantId = await mk(`${RUN}-free`, free.id);
  proTenantId = await mk(`${RUN}-pro`, pro.id);
  otherProTenantId = await mk(`${RUN}-pro2`, pro.id);
});

afterAll(async () => {
  const ids = [freeTenantId, proTenantId, otherProTenantId].filter(Boolean);
  await dbAdmin.subscription.deleteMany({ where: { tenantId: { in: ids } } });
  await dbAdmin.tenant.deleteMany({ where: { id: { in: ids } } });
  await dbAdmin.$disconnect();
});

describe('setCustomDomain', () => {
  it('Free: bị chặn', async () => {
    const res = await setCustomDomain(freeTenantId, 'nhaxe-free.vn');
    expect(res.ok).toBe(false);
  });

  it('Pro: đặt được, trạng thái chưa xác thực', async () => {
    const res = await setCustomDomain(proTenantId, 'NhaXeCuaBan.VN');
    expect(res.ok).toBe(true);
    const t = await dbAdmin.tenant.findUnique({ where: { id: proTenantId } });
    expect(t?.customDomain).toBe('nhaxecuaban.vn'); // chuẩn hóa lowercase
    expect(t?.customDomainVerified).toBe(false);
  });

  it('Pro: định dạng không hợp lệ -> lỗi', async () => {
    const res = await setCustomDomain(proTenantId, 'không hợp lệ');
    expect(res.ok).toBe(false);
  });

  it('Pro: trùng tên miền của tenant khác -> lỗi', async () => {
    const res = await setCustomDomain(otherProTenantId, 'nhaxecuaban.vn');
    expect(res.ok).toBe(false);
  });

  it('xóa tên miền (để trống) -> ok', async () => {
    const res = await setCustomDomain(proTenantId, '');
    expect(res.ok).toBe(true);
    const t = await dbAdmin.tenant.findUnique({ where: { id: proTenantId } });
    expect(t?.customDomain).toBeNull();
  });
});

describe('verifyCustomDomain', () => {
  it('chưa có tên miền -> lỗi', async () => {
    const res = await verifyCustomDomain(proTenantId);
    expect(res.ok).toBe(false);
  });

  it('tên miền không trỏ về (không kết nối được) -> lỗi, không ném', async () => {
    await setCustomDomain(proTenantId, 'domain-khong-ton-tai-12345.invalid');
    const res = await verifyCustomDomain(proTenantId);
    expect(res.ok).toBe(false);
  });
});
