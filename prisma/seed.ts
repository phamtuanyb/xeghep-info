/**
 * Seed dữ liệu mẫu — Module M0.
 *
 * Tạo:
 *  - 2 Plan: FREE, PRO
 *  - 4 Theme: default (FREE) + theme-a, theme-b, theme-c (PRO)
 *  - 1 PlatformUser SUPER_ADMIN (cấp nền tảng MKT)
 *  - 2 Tenant: A (gói FREE, theme default) và B (gói PRO, theme-a)
 *      Mỗi tenant có chủ xe, tài xế, tuyến, chuyến, bài viết, nội dung trang chủ riêng
 *      => phục vụ bộ test cô lập tenant ở Module M1.
 *
 * Idempotent: dùng upsert theo khóa duy nhất để chạy lại nhiều lần không nhân bản.
 */
import { PrismaClient, PlanName, TenantStatus, TenantRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'MatKhau@123'; // mật khẩu mẫu cho mọi tài khoản seed

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---------- Gói (Plan) ----------
  const freePlan = await prisma.plan.upsert({
    where: { name: PlanName.FREE },
    update: { priceMonthly: 0 },
    create: {
      name: PlanName.FREE,
      maxRoutes: 5,
      maxDrivers: 3,
      priceMonthly: 0,
      features: {
        customDomain: false,
        hidePoweredBy: false,
        themeSelection: false, // chỉ theme default
        driverSelfServe: false,
        coupons: false,
        reportsDetailed: false,
        seoFull: false,
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: PlanName.PRO },
    update: { priceMonthly: 300000 },
    create: {
      name: PlanName.PRO,
      maxRoutes: -1, // không giới hạn
      maxDrivers: -1,
      priceMonthly: 300000,
      features: {
        customDomain: true,
        hidePoweredBy: true,
        themeSelection: true,
        driverSelfServe: true,
        coupons: true,
        reportsDetailed: true,
        seoFull: true,
      },
    },
  });

  // ---------- Kho giao diện (Theme) ----------
  const themeDefault = await prisma.theme.upsert({
    where: { key: 'default' },
    update: {},
    create: { key: 'default', name: 'Giao diện mặc định', minPlan: PlanName.FREE, isActive: true },
  });

  const themeA = await prisma.theme.upsert({
    where: { key: 'theme-a' },
    update: {},
    create: { key: 'theme-a', name: 'Giao diện Năng động', minPlan: PlanName.PRO, isActive: true },
  });

  await prisma.theme.upsert({
    where: { key: 'theme-b' },
    update: {},
    create: { key: 'theme-b', name: 'Giao diện Tối giản', minPlan: PlanName.PRO, isActive: true },
  });

  await prisma.theme.upsert({
    where: { key: 'theme-c' },
    update: {},
    create: { key: 'theme-c', name: 'Giao diện Hoàng hôn', minPlan: PlanName.PRO, isActive: true },
  });

  // ---------- Mẫu giao diện trên trang giới thiệu gốc (Super Admin quản lý) ----------
  const landingCount = await prisma.landingTemplate.count();
  if (landingCount === 0) {
    await prisma.landingTemplate.createMany({
      data: [
        { name: 'Mẫu Hiện Đại', tag: 'Free', description: 'Hero ảnh xe nổi bật, form đặt chuyến ngay trên trang chủ, bố cục sạch hiện đại.', sortOrder: 1 },
        { name: 'Mẫu Năng Động', tag: 'Pro', description: 'Hero gradient xanh nổi bật, nút cam, form đặt xe ngay trên trang chủ.', sortOrder: 2 },
        { name: 'Mẫu Tối Giản', tag: 'Pro', description: 'Nền trắng, viền mảnh, gọn gàng, tập trung nội dung.', sortOrder: 3 },
        { name: 'Mẫu Hoàng Hôn', tag: 'Pro', description: 'Tông cam ấm áp, hero gradient hoàng hôn, thân thiện.', sortOrder: 4 },
      ],
    });
  }

  // ---------- Super Admin (cấp nền tảng) ----------
  const superAdmin = await prisma.platformUser.upsert({
    where: { email: 'admin@xeghep-mkt.vn' },
    update: {},
    create: {
      email: 'admin@xeghep-mkt.vn',
      password: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // ---------- Hàm tạo 1 tenant đầy đủ dữ liệu nghiệp vụ ----------
  async function seedTenant(opts: {
    slug: string;
    brandName: string;
    hotline: string;
    themeId: string;
    planId: string;
    expiresAt: Date | null;
    adminEmail: string;
    routes: { fromName: string; toName: string; slug: string; priceFrom: number; icon: string }[];
    drivers: { fullName: string; carType: string; carColor: string; plateNumber: string }[];
    articleTitle: string;
    articleSlug: string;
  }) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: opts.slug },
      update: {},
      create: {
        slug: opts.slug,
        brandName: opts.brandName,
        hotline: opts.hotline,
        status: TenantStatus.ACTIVE,
        themeId: opts.themeId,
        primaryColor: '#1565C0',
        onboardedAt: new Date(), // tenant mẫu coi như đã qua onboarding
      },
    });

    // Subscription
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: { planId: opts.planId, expiresAt: opts.expiresAt },
      create: {
        tenantId: tenant.id,
        planId: opts.planId,
        status: 'active',
        expiresAt: opts.expiresAt,
      },
    });

    // Chủ xe (TENANT_ADMIN)
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: opts.adminEmail } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: opts.adminEmail,
        password: passwordHash,
        fullName: `Chủ xe ${opts.brandName}`,
        phone: '0900000000',
        role: TenantRole.TENANT_ADMIN,
      },
    });

    // Tuyến
    for (const r of opts.routes) {
      await prisma.route.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: r.slug } },
        update: {},
        create: {
          tenantId: tenant.id,
          fromName: r.fromName,
          toName: r.toName,
          slug: r.slug,
          priceFrom: r.priceFrom,
          icon: r.icon,
        },
      });
    }

    // Tài xế + tài khoản đăng nhập cổng tài xế (User role DRIVER) đã liên kết.
    for (let i = 0; i < opts.drivers.length; i++) {
      const d = opts.drivers[i]!;
      const existing = await prisma.driver.findFirst({
        where: { tenantId: tenant.id, plateNumber: d.plateNumber },
      });
      if (!existing) {
        const driverEmail = `taixe${i + 1}@${opts.slug}.vn`;
        const driverUser = await prisma.user.upsert({
          where: { tenantId_email: { tenantId: tenant.id, email: driverEmail } },
          update: {},
          create: {
            tenantId: tenant.id,
            email: driverEmail,
            password: passwordHash,
            fullName: d.fullName,
            role: TenantRole.DRIVER,
          },
        });
        await prisma.driver.create({
          data: {
            tenantId: tenant.id,
            userId: driverUser.id,
            fullName: d.fullName,
            carType: d.carType,
            carColor: d.carColor,
            plateNumber: d.plateNumber,
            kycStatus: 'approved',
            rating: 4.8,
            tripCount: 12,
          },
        });
      }
    }

    // 1 chuyến mẫu (gắn tuyến đầu + tài xế đầu nếu có)
    const firstRoute = await prisma.route.findFirst({ where: { tenantId: tenant.id } });
    const firstDriver = await prisma.driver.findFirst({ where: { tenantId: tenant.id } });
    if (firstRoute) {
      const existingTrip = await prisma.trip.findFirst({
        where: { tenantId: tenant.id, routeId: firstRoute.id },
      });
      if (!existingTrip) {
        await prisma.trip.create({
          data: {
            tenantId: tenant.id,
            routeId: firstRoute.id,
            driverId: firstDriver?.id ?? null,
            departAt: new Date('2026-06-15T07:00:00.000Z'),
            seatsTotal: 7,
            seatsLeft: 5,
            pricePerSeat: firstRoute.priceFrom,
            serviceType: 'ghep_1',
            status: 'open',
          },
        });
      }
    }

    // Bài viết
    await prisma.article.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: opts.articleSlug } },
      update: {},
      create: {
        tenantId: tenant.id,
        title: opts.articleTitle,
        slug: opts.articleSlug,
        contentHtml: `<p>${opts.articleTitle} — nội dung mẫu của ${opts.brandName}.</p>`,
        status: 'published',
        publishedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    });

    // Nội dung trang chủ
    await prisma.homeContent.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        data: {
          hero: {
            title: `Xe ghép ${opts.brandName}`,
            subtitle: 'Đặt xe nhanh chóng, an toàn, đúng giờ.',
            ctaLabel: 'Tìm chuyến ngay',
          },
          banners: [
            { title: `Chào mừng đến ${opts.brandName}`, subtitle: 'Đón tận nơi, giá minh bạch.' },
            { title: 'Tài xế đã xác thực', subtitle: 'An tâm trên mọi chặng đường.' },
          ],
          whyChooseUs: [
            { title: 'Tài xế đã xác thực', desc: 'Hồ sơ CCCD, giấy phép, đăng kiểm được duyệt.' },
            { title: 'Giá minh bạch', desc: 'Báo giá rõ ràng trước khi đặt.' },
            { title: 'Đặt chỗ dễ dàng', desc: 'Để lại thông tin, được gọi xác nhận ngay.' },
          ],
          howToBook: [
            { title: 'Chọn tuyến', desc: 'Nhập điểm đi, điểm đến và ngày.' },
            { title: 'Để lại thông tin', desc: 'Điền họ tên, số điện thoại, số ghế.' },
            { title: 'Nhận xác nhận', desc: 'Tổng đài gọi lại xác nhận chuyến.' },
          ],
          faq: [
            { q: 'Tôi có cần đặt cọc không?', a: 'Không, bạn thanh toán trực tiếp cho tài xế khi đi.' },
            { q: 'Có đón tận nhà không?', a: 'Có, tài xế đón và trả tận nơi theo thỏa thuận.' },
          ],
          driverCta: {
            title: 'Bạn là tài xế?',
            desc: 'Tham gia đội ngũ để nhận thêm chuyến và khách hàng.',
            buttonLabel: 'Xem đội ngũ tài xế',
          },
        },
      },
    });

    // Cấu hình tenant
    await prisma.tenantSetting.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        seoTitle: `Xe ghép ${opts.brandName}`,
        seoDescription: `Dịch vụ xe ghép ${opts.brandName} — đặt xe nhanh, an toàn.`,
        allowIndex: true,
      },
    });

    return tenant;
  }

  // ---------- Tenant A (gói FREE, theme default) ----------
  await seedTenant({
    slug: 'nha-xe-an-binh',
    brandName: 'Nhà xe An Bình',
    hotline: '0901111111',
    themeId: themeDefault.id,
    planId: freePlan.id,
    expiresAt: null, // Free không hết hạn
    adminEmail: 'chuxe@an-binh.vn',
    routes: [
      { fromName: 'Hà Nội', toName: 'Yên Bái', slug: 'ha-noi-yen-bai', priceFrom: 250000, icon: '🚗' },
      { fromName: 'Hà Nội', toName: 'Lào Cai', slug: 'ha-noi-lao-cai', priceFrom: 350000, icon: '🚙' },
    ],
    drivers: [
      { fullName: 'Nguyễn Văn An', carType: 'Toyota Vios', carColor: 'Trắng', plateNumber: '21A-111.11' },
      { fullName: 'Trần Văn Bình', carType: 'Kia Carnival', carColor: 'Đen', plateNumber: '21A-222.22' },
    ],
    articleTitle: 'Kinh nghiệm đi xe ghép Hà Nội - Yên Bái',
    articleSlug: 'kinh-nghiem-ha-noi-yen-bai',
  });

  // ---------- Tenant B (gói PRO, theme-a) ----------
  await seedTenant({
    slug: 'nha-xe-phuong-nam',
    brandName: 'Nhà xe Phương Nam',
    hotline: '0902222222',
    themeId: themeA.id,
    planId: proPlan.id,
    expiresAt: new Date('2027-06-08T00:00:00.000Z'),
    adminEmail: 'chuxe@phuong-nam.vn',
    routes: [
      { fromName: 'TP.HCM', toName: 'Vũng Tàu', slug: 'hcm-vung-tau', priceFrom: 180000, icon: '🚗' },
      { fromName: 'TP.HCM', toName: 'Đà Lạt', slug: 'hcm-da-lat', priceFrom: 320000, icon: '🚙' },
    ],
    drivers: [
      { fullName: 'Lê Văn Cường', carType: 'Honda CR-V', carColor: 'Xám', plateNumber: '51A-333.33' },
      { fullName: 'Phạm Văn Dũng', carType: 'Ford Transit', carColor: 'Bạc', plateNumber: '51A-444.44' },
    ],
    articleTitle: 'Cẩm nang du lịch Đà Lạt bằng xe ghép',
    articleSlug: 'cam-nang-da-lat',
  });

  // ---------- Tenant C (chưa onboarding — để test wizard M4) ----------
  const onboardingTenant = await prisma.tenant.upsert({
    where: { slug: 'nha-xe-moi' },
    update: { onboardedAt: null },
    create: {
      slug: 'nha-xe-moi',
      brandName: 'Nhà xe Mới',
      status: TenantStatus.ACTIVE,
      onboardedAt: null, // chưa qua wizard
      themeId: themeDefault.id,
      subscription: { create: { planId: freePlan.id, expiresAt: null } },
    },
  });
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: onboardingTenant.id, email: 'chuxe@moi.vn' } },
    update: {},
    create: {
      tenantId: onboardingTenant.id,
      email: 'chuxe@moi.vn',
      password: passwordHash,
      fullName: 'Chủ xe Mới',
      role: TenantRole.TENANT_ADMIN,
    },
  });

  // ---------- Mã kích hoạt demo (PHA 2 onboarding tự động) ----------
  await prisma.activationCode.upsert({
    where: { code: 'DEMO-PRO-2026' },
    update: { status: 'active', usedByTenantId: null, usedAt: null },
    create: { code: 'DEMO-PRO-2026', planName: PlanName.PRO, createdBy: superAdmin.id, note: 'Mã demo gói Pro' },
  });
  await prisma.activationCode.upsert({
    where: { code: 'DEMO-FREE-2026' },
    update: { status: 'active', usedByTenantId: null, usedAt: null },
    create: { code: 'DEMO-FREE-2026', planName: PlanName.FREE, createdBy: superAdmin.id, note: 'Mã demo gói Free' },
  });

  console.log('✅ Seed hoàn tất:');
  console.log('   - 2 Plan (FREE, PRO), 4 Theme (default, theme-a, theme-b, theme-c)');
  console.log('   - 1 Super Admin: admin@xeghep-mkt.vn');
  console.log('   - Tenant A (FREE): nha-xe-an-binh / chuxe@an-binh.vn');
  console.log('   - Tenant B (PRO):  nha-xe-phuong-nam / chuxe@phuong-nam.vn');
  console.log(`   - Mật khẩu mẫu cho mọi tài khoản: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
