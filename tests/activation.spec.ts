/**
 * Test onboarding tự động bằng mã kích hoạt (CLAUDE.md Mục 14 PHA 2).
 * Đổi mã -> tạo tenant + admin + subscription; chống đổi 2 lần; slug trùng/không hợp lệ.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbAdmin } from '@/lib/db';
import { generateActivationCodes, redeemActivationCode } from '@/lib/activation';

const RUN = `act-${Date.now()}`;
const createdTenantSlugs: string[] = [];
const createdCodes: string[] = [];

beforeAll(async () => {
  // Đảm bảo có gói + theme default cho redeem.
  await dbAdmin.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: { name: 'FREE', maxRoutes: 5, maxDrivers: 3, features: {} },
  });
  await dbAdmin.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: { name: 'PRO', maxRoutes: -1, maxDrivers: -1, features: { customDomain: true } },
  });
  await dbAdmin.theme.upsert({
    where: { key: 'default' },
    update: {},
    create: { key: 'default', name: 'Mặc định', minPlan: 'FREE', isActive: true },
  });
});

afterAll(async () => {
  for (const slug of createdTenantSlugs) {
    const t = await dbAdmin.tenant.findUnique({ where: { slug } });
    if (t) {
      await dbAdmin.subscription.deleteMany({ where: { tenantId: t.id } });
      await dbAdmin.user.deleteMany({ where: { tenantId: t.id } });
      await dbAdmin.tenant.delete({ where: { id: t.id } });
    }
  }
  if (createdCodes.length) await dbAdmin.activationCode.deleteMany({ where: { code: { in: createdCodes } } });
  await dbAdmin.$disconnect();
});

describe('generateActivationCodes', () => {
  it('sinh đúng số lượng mã, đều active', async () => {
    const codes = await generateActivationCodes('PRO', 3, 'test-admin', 'đợt test');
    createdCodes.push(...codes);
    expect(codes).toHaveLength(3);
    const rows = await dbAdmin.activationCode.findMany({ where: { code: { in: codes } } });
    expect(rows.every((r) => r.status === 'active' && r.planName === 'PRO')).toBe(true);
  });
});

describe('redeemActivationCode', () => {
  it('đổi mã hợp lệ -> tạo tenant ACTIVE (onboardedAt null) + admin + subscription PRO', async () => {
    const [code] = await generateActivationCodes('PRO', 1, 'test-admin');
    createdCodes.push(code!);
    const slug = `${RUN}-pro`;
    createdTenantSlugs.push(slug);

    const res = await redeemActivationCode({
      code: code!,
      brandName: 'Nhà xe Kích Hoạt',
      slug,
      ownerName: 'Chủ Xe',
      ownerEmail: `owner@${slug}.vn`,
      ownerPassword: 'matkhau123',
    });
    expect(res.ok).toBe(true);

    const tenant = await dbAdmin.tenant.findUnique({
      where: { slug },
      include: { subscription: { include: { plan: true } }, users: true },
    });
    expect(tenant?.status).toBe('ACTIVE');
    expect(tenant?.onboardedAt).toBeNull();
    expect(tenant?.subscription?.plan.name).toBe('PRO');
    expect(tenant?.users.some((u) => u.role === 'TENANT_ADMIN' && u.email === `owner@${slug}.vn`)).toBe(true);

    // mã đã chuyển sang used.
    const ac = await dbAdmin.activationCode.findUnique({ where: { code: code! } });
    expect(ac?.status).toBe('used');
    expect(ac?.usedByTenantId).toBe(tenant?.id);
  });

  it('đổi lại mã đã dùng -> bị chặn', async () => {
    const [code] = await generateActivationCodes('FREE', 1, 'test-admin');
    createdCodes.push(code!);
    const slug = `${RUN}-once`;
    createdTenantSlugs.push(slug);

    const first = await redeemActivationCode({ code: code!, brandName: 'A', slug, ownerEmail: `a@${slug}.vn`, ownerPassword: 'matkhau123' });
    expect(first.ok).toBe(true);

    const second = await redeemActivationCode({ code: code!, brandName: 'B', slug: `${slug}-2`, ownerEmail: `b@${slug}.vn`, ownerPassword: 'matkhau123' });
    expect(second.ok).toBe(false);
  });

  it('mã không tồn tại -> lỗi', async () => {
    const res = await redeemActivationCode({ code: 'KHONG-CO-MA', brandName: 'X', slug: `${RUN}-none`, ownerEmail: 'x@x.vn', ownerPassword: 'matkhau123' });
    expect(res.ok).toBe(false);
  });

  it('slug trùng -> lỗi (mã không bị tiêu)', async () => {
    const [code] = await generateActivationCodes('FREE', 1, 'test-admin');
    createdCodes.push(code!);
    // dùng slug đã tạo ở test đầu
    const res = await redeemActivationCode({ code: code!, brandName: 'X', slug: `${RUN}-pro`, ownerEmail: 'x@x.vn', ownerPassword: 'matkhau123' });
    expect(res.ok).toBe(false);
    // mã vẫn còn active (transaction rollback)
    const ac = await dbAdmin.activationCode.findUnique({ where: { code: code! } });
    expect(ac?.status).toBe('active');
  });

  it('slug không hợp lệ / dành riêng -> lỗi', async () => {
    const [code] = await generateActivationCodes('FREE', 1, 'test-admin');
    createdCodes.push(code!);
    const bad = await redeemActivationCode({ code: code!, brandName: 'X', slug: 'admin', ownerEmail: 'x@x.vn', ownerPassword: 'matkhau123' });
    expect(bad.ok).toBe(false);
    const bad2 = await redeemActivationCode({ code: code!, brandName: 'X', slug: 'Có Dấu', ownerEmail: 'x@x.vn', ownerPassword: 'matkhau123' });
    expect(bad2.ok).toBe(false);
  });
});
