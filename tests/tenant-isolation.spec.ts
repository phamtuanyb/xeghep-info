/**
 * CỔNG TEST BẮT BUỘC (CLAUDE.md Mục 15) — cô lập người thuê.
 *
 * Tạo 2 tenant A & B với dữ liệu riêng, rồi chứng minh: dưới tenant context A,
 * KHÔNG truy vấn/sửa/xóa nào chạm tới dữ liệu B — kể cả khi cố tình truyền id
 * của B (tấn công id chéo tenant). Đồng thời chứng minh thao tác ngoài tenant
 * context bị chặn (fail-closed), và create luôn gắn đúng tenant hiện tại.
 *
 * KHÔNG PASS = M1 chưa xong (cấm merge thay đổi dữ liệu).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, dbAdmin } from '@/lib/db';
import { runWithTenant } from '@/lib/tenant-context';

// Hậu tố duy nhất theo lần chạy để tránh đụng slug/khóa unique với dữ liệu seed.
const RUN = `iso-${Date.now()}`;

type Seeded = {
  tenantId: string;
  routeId: string;
  driverId: string;
  tripId: string;
  bookingId: string;
  articleId: string;
};

let A: Seeded;
let B: Seeded;

/**
 * Chạy một thao tác DB trong tenant context và AWAIT NGAY BÊN TRONG context.
 * Quan trọng: PrismaPromise thực thi lười (khi .then/await). Nếu await ngoài
 * runWithTenant thì extension đọc context quá muộn -> mất context. Trong app thật,
 * cả request handler nằm trong runWithTenant nên await luôn diễn ra bên trong.
 */
function runAs<T>(tenantId: string, op: () => PromiseLike<T>): Promise<T> {
  return runWithTenant(tenantId, async () => await op());
}

/** Tạo 1 tenant đầy đủ dữ liệu nghiệp vụ bằng dbAdmin (đặt tenantId tường minh). */
async function seedTenant(tag: string): Promise<Seeded> {
  const tenant = await dbAdmin.tenant.create({
    data: { brandName: `Test ${tag}`, slug: `${RUN}-${tag}`, status: 'ACTIVE' },
  });
  const route = await dbAdmin.route.create({
    data: {
      tenantId: tenant.id,
      fromName: `From ${tag}`,
      toName: `To ${tag}`,
      slug: `route-${tag}`,
      priceFrom: 100000,
    },
  });
  const driver = await dbAdmin.driver.create({
    data: { tenantId: tenant.id, fullName: `Tài xế ${tag}`, plateNumber: `PLATE-${tag}` },
  });
  const trip = await dbAdmin.trip.create({
    data: {
      tenantId: tenant.id,
      routeId: route.id,
      driverId: driver.id,
      departAt: new Date('2026-07-01T00:00:00.000Z'),
      seatsTotal: 7,
      seatsLeft: 7,
      pricePerSeat: 120000,
      serviceType: 'ghep_1',
    },
  });
  const booking = await dbAdmin.booking.create({
    data: {
      tenantId: tenant.id,
      tripId: trip.id,
      customerName: `Khách ${tag}`,
      customerPhone: '0900000000',
    },
  });
  const article = await dbAdmin.article.create({
    data: {
      tenantId: tenant.id,
      title: `Bài ${tag}`,
      slug: `bai-${tag}`,
      contentHtml: '<p>nội dung</p>',
    },
  });
  return {
    tenantId: tenant.id,
    routeId: route.id,
    driverId: driver.id,
    tripId: trip.id,
    bookingId: booking.id,
    articleId: article.id,
  };
}

beforeAll(async () => {
  A = await seedTenant('A');
  B = await seedTenant('B');
});

afterAll(async () => {
  const ids = [A?.tenantId, B?.tenantId].filter(Boolean) as string[];
  if (ids.length) {
    // Xóa con trước (tránh phụ thuộc thứ tự cascade), rồi xóa tenant.
    await dbAdmin.transaction.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.booking.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.trip.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.route.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.driver.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.article.deleteMany({ where: { tenantId: { in: ids } } });
    await dbAdmin.tenant.deleteMany({ where: { id: { in: ids } } });
  }
  await dbAdmin.$disconnect();
  await db.$disconnect();
});

describe('Cô lập tenant — đọc dữ liệu', () => {
  it('findMany chỉ trả dữ liệu của tenant hiện tại', async () => {
    const routes = await runAs(A.tenantId, () => db.route.findMany());
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.every((r) => r.tenantId === A.tenantId)).toBe(true);
    expect(routes.some((r) => r.id === B.routeId)).toBe(false);
  });

  it('findUnique với id chéo tenant trả về null (B vô hình với A)', async () => {
    const route = await runAs(A.tenantId, () => db.route.findUnique({ where: { id: B.routeId } }));
    expect(route).toBeNull();
  });

  it('findFirst với id chéo tenant trả về null', async () => {
    const booking = await runAs(A.tenantId, () => db.booking.findFirst({ where: { id: B.bookingId } }));
    expect(booking).toBeNull();
  });

  it('A vẫn đọc được chính dữ liệu của mình (positive control)', async () => {
    const route = await runAs(A.tenantId, () => db.route.findUnique({ where: { id: A.routeId } }));
    expect(route?.id).toBe(A.routeId);
    expect(route?.tenantId).toBe(A.tenantId);
  });

  it('count chỉ đếm trong phạm vi tenant hiện tại', async () => {
    const countA = await runAs(A.tenantId, () => db.route.count());
    const countB = await runAs(B.tenantId, () => db.route.count());
    const total = await dbAdmin.route.count({ where: { tenantId: { in: [A.tenantId, B.tenantId] } } });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
    expect(total).toBe(2);
  });
});

describe('Cô lập tenant — ghi/sửa/xóa chéo tenant bị chặn', () => {
  it('update record của B dưới context A bị chặn và B không đổi', async () => {
    await expect(
      runAs(A.tenantId, () => db.route.update({ where: { id: B.routeId }, data: { priceFrom: 1 } }))
    ).rejects.toThrow();

    const untouched = await dbAdmin.route.findUnique({ where: { id: B.routeId } });
    expect(untouched?.priceFrom).toBe(100000);
  });

  it('updateMany dưới context A không chạm record của B', async () => {
    await runAs(A.tenantId, () => db.route.updateMany({ data: { priceFrom: 999000 } }));

    const bRoute = await dbAdmin.route.findUnique({ where: { id: B.routeId } });
    const aRoute = await dbAdmin.route.findUnique({ where: { id: A.routeId } });
    expect(bRoute?.priceFrom).toBe(100000); // B nguyên vẹn
    expect(aRoute?.priceFrom).toBe(999000); // chỉ A bị đổi
  });

  it('delete record của B dưới context A bị chặn và B vẫn tồn tại', async () => {
    await expect(
      runAs(A.tenantId, () => db.driver.delete({ where: { id: B.driverId } }))
    ).rejects.toThrow();

    const stillThere = await dbAdmin.driver.findUnique({ where: { id: B.driverId } });
    expect(stillThere?.id).toBe(B.driverId);
  });

  it('deleteMany dưới context A không xóa dữ liệu B', async () => {
    await runAs(A.tenantId, () => db.article.deleteMany({ where: { slug: 'bai-B' } }));
    const bArticle = await dbAdmin.article.findUnique({ where: { id: B.articleId } });
    expect(bArticle?.id).toBe(B.articleId); // không bị xóa nhầm
  });
});

describe('Cô lập tenant — tạo mới luôn gắn đúng tenant', () => {
  it('create bỏ qua tenantId giả mạo, luôn gán tenant hiện tại', async () => {
    const created = await runAs(A.tenantId, () =>
      db.route.create({
        data: {
          // Cố tình giả mạo sang B — extension PHẢI ghi đè về A.
          tenantId: B.tenantId,
          fromName: 'Giả mạo',
          toName: 'Giả mạo',
          slug: `forged-${RUN}`,
          priceFrom: 1,
        } as never,
      })
    );
    expect(created.tenantId).toBe(A.tenantId);
    expect(created.tenantId).not.toBe(B.tenantId);
  });
});

describe('Fail-closed — thao tác ngoài tenant context bị chặn', () => {
  it('truy vấn model nghiệp vụ ngoài runWithTenant bị ném lỗi', async () => {
    await expect(db.route.findMany()).rejects.toThrow(/tenant context/i);
  });

  it('create model nghiệp vụ ngoài tenant context bị ném lỗi', async () => {
    await expect(
      db.driver.create({ data: { fullName: 'x' } as never })
    ).rejects.toThrow(/tenant context/i);
  });
});
