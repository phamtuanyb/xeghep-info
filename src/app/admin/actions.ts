'use server';

/**
 * Server Actions của Tenant Admin (CLAUDE.md Mục 12.B). Mọi action:
 * Zod validate -> check role (withAdminAction) -> check entitlement -> DB (db cô lập
 * tenant) -> ghi AuditLog -> revalidate/redirect.
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { db, dbAdmin } from '@/lib/db';
import { withAdminAction, logAudit } from '@/lib/admin-auth';
import { withPublicTenant } from '@/lib/public-tenant';
import {
  verifyTenantCredentials,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
} from '@/lib/auth';
import {
  assertWithinLimit,
  assertCanSelectTheme,
  assertCanHidePoweredBy,
  can,
  EntitlementError,
} from '@/lib/entitlement';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { slugify } from '@/lib/slug';
import { revalidateTenantPublic } from '@/lib/public-cache';
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { setCustomDomain, verifyCustomDomain } from '@/lib/custom-domain';

const COMMISSION_RATE = 0.12; // hoa hồng 12% (CLAUDE.md Mục 12.B)

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function num(formData: FormData, key: string): number {
  return Number(str(formData, key)) || 0;
}

// ---------------- Đăng nhập / Đăng xuất ----------------

export async function adminLoginAction(formData: FormData): Promise<void> {
  const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'anon';
  if (!(await rateLimit(`admin-login:${ip}`, 10, 60)).ok) {
    redirect('/admin/dang-nhap?error=' + encodeURIComponent(RATE_LIMIT_MESSAGE));
  }
  const email = str(formData, 'email');
  const password = str(formData, 'password');

  const result = await withPublicTenant(
    async (tenant): Promise<{ ok: boolean; payload?: { userId: string; role: string; tenantId: string }; reason?: string }> => {
      const login = await verifyTenantCredentials(email, password);
      if (!login.ok) {
        return { ok: false, reason: login.reason === 'locked' ? 'Tài khoản đã bị khóa.' : 'Email hoặc mật khẩu không đúng.' };
      }
      if (login.payload.role !== 'TENANT_ADMIN' && login.payload.role !== 'TENANT_OPERATOR') {
        return { ok: false, reason: 'Tài khoản không có quyền truy cập trang quản trị.' };
      }
      return { ok: true, payload: { userId: login.payload.userId, role: login.payload.role, tenantId: tenant.id } };
    }
  );

  if (!result.ok) redirect('/admin/dang-nhap?error=' + encodeURIComponent(result.reason ?? 'Đăng nhập thất bại.'));
  await setSessionCookie(result.payload!);
  redirect('/admin');
}

export async function adminLogoutAction(): Promise<void> {
  clearSessionCookie();
  redirect('/admin/dang-nhap');
}

// ---------------- Lead (Booking) ----------------

export async function updateBookingStatusAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  await withAdminAction({}, async ({ session }) => {
    await db.booking.update({ where: { id }, data: { status } });
    await logAudit(session.userId, 'UPDATE_BOOKING_STATUS', { id, status });
  });
  revalidatePath('/admin/lead');
}

// ---------------- Tuyến (Route) — áp giới hạn gói ----------------

export async function upsertRouteAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const result = await withAdminAction({}, async ({ session }): Promise<{ error?: string }> => {
    const data = z
      .object({
        fromName: z.string().min(1, 'Nhập điểm đi'),
        toName: z.string().min(1, 'Nhập điểm đến'),
        priceFrom: z.coerce.number().int().min(0),
        icon: z.string().optional().default(''),
      })
      .parse({
        fromName: str(formData, 'fromName'),
        toName: str(formData, 'toName'),
        priceFrom: num(formData, 'priceFrom'),
        icon: str(formData, 'icon'),
      });

    if (!id) {
      try {
        await assertWithinLimit(session.tenantId, 'routes');
      } catch (e) {
        if (e instanceof EntitlementError) return { error: e.message };
        throw e;
      }
    }

    const slug = slugify(`${data.fromName}-${data.toName}`) || `tuyen-${Date.now()}`;
    if (id) {
      await db.route.update({ where: { id }, data: { fromName: data.fromName, toName: data.toName, priceFrom: data.priceFrom, icon: data.icon || null } });
    } else {
      await db.route.create({ data: { tenantId: session.tenantId, fromName: data.fromName, toName: data.toName, slug, priceFrom: data.priceFrom, icon: data.icon || null } });
    }
    await logAudit(session.userId, id ? 'UPDATE_ROUTE' : 'CREATE_ROUTE', { id });
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result.error) redirect('/admin/tuyen?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/tuyen');
}

export async function deleteRouteAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    await db.route.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_ROUTE', { id });
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/tuyen');
}

// ---------------- Tài xế (Driver) + KYC — áp giới hạn gói ----------------

export async function upsertDriverAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const result = await withAdminAction({}, async ({ session }): Promise<{ error?: string }> => {
    const data = z
      .object({
        fullName: z.string().min(1, 'Nhập tên tài xế'),
        carType: z.string().optional().default(''),
        carColor: z.string().optional().default(''),
        plateNumber: z.string().optional().default(''),
        avatarUrl: z.string().optional().default(''),
      })
      .parse({
        fullName: str(formData, 'fullName'),
        carType: str(formData, 'carType'),
        carColor: str(formData, 'carColor'),
        plateNumber: str(formData, 'plateNumber'),
        avatarUrl: str(formData, 'avatarUrl'),
      });

    if (!id) {
      try {
        await assertWithinLimit(session.tenantId, 'drivers');
      } catch (e) {
        if (e instanceof EntitlementError) return { error: e.message };
        throw e;
      }
    }

    const payload = {
      fullName: data.fullName,
      carType: data.carType || null,
      carColor: data.carColor || null,
      plateNumber: data.plateNumber || null,
      avatarUrl: data.avatarUrl || null,
    };
    if (id) {
      await db.driver.update({ where: { id }, data: payload });
    } else {
      await db.driver.create({ data: { tenantId: session.tenantId, ...payload } });
    }
    await logAudit(session.userId, id ? 'UPDATE_DRIVER' : 'CREATE_DRIVER', { id });
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result.error) redirect('/admin/tai-xe?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/tai-xe');
}

export async function setKycStatusAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const kycStatus = str(formData, 'kycStatus'); // approved | rejected | pending
  await withAdminAction({}, async ({ session }) => {
    await db.driver.update({ where: { id }, data: { kycStatus } });
    await logAudit(session.userId, 'SET_KYC', { id, kycStatus });
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/tai-xe');
}

export async function deleteDriverAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    await db.driver.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_DRIVER', { id });
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/tai-xe');
}

/** Cấp tài khoản đăng nhập cổng tài xế (User role DRIVER) và gắn vào hồ sơ Driver. */
export async function createDriverAccountAction(formData: FormData): Promise<void> {
  const driverId = str(formData, 'driverId');
  const result = await withAdminAction({}, async ({ session }): Promise<{ error?: string }> => {
    const data = z
      .object({ email: z.string().email('Email không hợp lệ'), password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự') })
      .parse({ email: str(formData, 'email'), password: str(formData, 'password') });

    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver) return { error: 'Không tìm thấy tài xế.' };
    if (driver.userId) return { error: 'Tài xế đã có tài khoản.' };
    const existing = await db.user.findFirst({ where: { email: data.email } });
    if (existing) return { error: 'Email đã tồn tại trong tenant.' };

    const user = await db.user.create({
      data: {
        tenantId: session.tenantId,
        email: data.email,
        password: await hashPassword(data.password),
        fullName: driver.fullName,
        role: 'DRIVER',
      },
    });
    await db.driver.update({ where: { id: driver.id }, data: { userId: user.id } });
    await logAudit(session.userId, 'CREATE_DRIVER_ACCOUNT', { driverId, email: data.email });
    return {};
  });

  if (result.error) redirect('/admin/tai-xe?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/tai-xe');
}

// ---------------- Chuyến (Trip) ----------------

export async function upsertTripAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    const data = z
      .object({
        routeId: z.string().min(1, 'Chọn tuyến'),
        driverId: z.string().optional().default(''),
        departAt: z.string().min(1, 'Chọn giờ khởi hành'),
        seatsTotal: z.coerce.number().int().min(1),
        seatsLeft: z.coerce.number().int().min(0),
        pricePerSeat: z.coerce.number().int().min(0),
        serviceType: z.string().min(1),
        status: z.string().optional().default('open'),
      })
      .parse({
        routeId: str(formData, 'routeId'),
        driverId: str(formData, 'driverId'),
        departAt: str(formData, 'departAt'),
        seatsTotal: num(formData, 'seatsTotal'),
        seatsLeft: num(formData, 'seatsLeft'),
        pricePerSeat: num(formData, 'pricePerSeat'),
        serviceType: str(formData, 'serviceType') || 'ghep_1',
        status: str(formData, 'status') || 'open',
      });

    const payload = {
      routeId: data.routeId,
      driverId: data.driverId || null,
      departAt: new Date(data.departAt),
      seatsTotal: data.seatsTotal,
      seatsLeft: data.seatsLeft,
      pricePerSeat: data.pricePerSeat,
      serviceType: data.serviceType,
      status: data.status,
    };
    if (id) {
      await db.trip.update({ where: { id }, data: payload });
    } else {
      await db.trip.create({ data: { tenantId: session.tenantId, ...payload } });
    }
    await logAudit(session.userId, id ? 'UPDATE_TRIP' : 'CREATE_TRIP', { id });
  });
  revalidatePath('/admin/chuyen');
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    await db.trip.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_TRIP', { id });
  });
  revalidatePath('/admin/chuyen');
}

// ---------------- Giao dịch (Transaction) — hoa hồng 12% tính ở server ----------------

export async function upsertTransactionAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    const amount = Math.max(0, num(formData, 'amount'));
    const commission = Math.round(amount * COMMISSION_RATE); // TÍNH Ở SERVER
    const payload = {
      bookingId: str(formData, 'bookingId') || null,
      driverId: str(formData, 'driverId') || null,
      amount,
      commission,
      status: str(formData, 'status') || 'pending',
    };
    if (id) {
      await db.transaction.update({ where: { id }, data: payload });
    } else {
      await db.transaction.create({ data: { tenantId: session.tenantId, ...payload } });
    }
    await logAudit(session.userId, id ? 'UPDATE_TRANSACTION' : 'CREATE_TRANSACTION', { id, amount, commission });
  });
  revalidatePath('/admin/giao-dich');
}

export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    await db.transaction.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_TRANSACTION', { id });
  });
  revalidatePath('/admin/giao-dich');
}

// ---------------- Khiếu nại (Complaint) — tùy chọn hoàn tiền ----------------

export async function updateComplaintAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({}, async ({ session }) => {
    await db.complaint.update({
      where: { id },
      data: { status: str(formData, 'status') || 'open', refunded: formData.get('refunded') === 'on' },
    });
    await logAudit(session.userId, 'UPDATE_COMPLAINT', { id });
  });
  revalidatePath('/admin/khieu-nai');
}

// ---------------- CMS trang chủ (HomeContent) — chỉ Quản trị ----------------

export async function updateHomeContentAction(formData: FormData): Promise<void> {
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    const lines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);

    const banners = lines(str(formData, 'banners')).map((l) => {
      const [imageUrl, title, subtitle] = l.split('::').map((s) => s.trim());
      return { imageUrl: imageUrl || undefined, title: title ?? '', subtitle: subtitle ?? '' };
    });
    const why = [0, 1, 2].map((i) => ({ title: str(formData, `why_title_${i}`), desc: str(formData, `why_desc_${i}`) })).filter((w) => w.title);
    const how = [0, 1, 2].map((i) => ({ title: str(formData, `how_title_${i}`), desc: str(formData, `how_desc_${i}`) })).filter((h) => h.title);
    const faq = [0, 1, 2].map((i) => ({ q: str(formData, `faq_q_${i}`), a: str(formData, `faq_a_${i}`) })).filter((f) => f.q);

    const data = {
      hero: { title: str(formData, 'hero_title'), subtitle: str(formData, 'hero_subtitle'), ctaLabel: str(formData, 'hero_cta'), imageUrl: str(formData, 'hero_image') || undefined },
      banners,
      whyChooseUs: why,
      howToBook: how,
      faq,
      driverCta: { title: str(formData, 'cta_title'), desc: str(formData, 'cta_desc'), buttonLabel: str(formData, 'cta_button') },
    };

    await db.homeContent.upsert({
      where: { tenantId: session.tenantId },
      update: { data },
      create: { tenantId: session.tenantId, data },
    });
    await logAudit(session.userId, 'UPDATE_HOME_CONTENT');
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/noi-dung');
  redirect('/admin/noi-dung?saved=1');
}

// ---------------- Tin tức (Article) — chỉ Quản trị ----------------

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
];

export async function upsertArticleAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    const title = str(formData, 'title');
    const slug = str(formData, 'slug') || slugify(title) || `bai-${Date.now()}`;
    const contentHtml = sanitizeArticleHtml(str(formData, 'contentHtml')); // SANITIZE trước khi lưu
    const status = str(formData, 'status') || 'draft';
    const coverUrl = str(formData, 'coverUrl') || null;
    const payload = {
      title,
      slug,
      coverUrl,
      contentHtml,
      status,
      publishedAt: status === 'published' ? new Date() : null,
    };
    if (id) {
      await db.article.update({ where: { id }, data: payload });
    } else {
      await db.article.create({ data: { tenantId: session.tenantId, ...payload } });
    }
    await logAudit(session.userId, id ? 'UPDATE_ARTICLE' : 'CREATE_ARTICLE', { id, slug });
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/tin-tuc');
  redirect('/admin/tin-tuc?saved=1');
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await db.article.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_ARTICLE', { id });
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/tin-tuc');
}

/** Đăng bài bằng .docx (một hoặc nhiều file/thư mục). Convert -> sanitize -> tạo Article. */
export async function importDocxAction(formData: FormData): Promise<void> {
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  const randomCover = formData.get('randomCover') === 'on';
  const publish = formData.get('publish') === 'on';

  const count = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<number> => {
    const mammoth = await import('mammoth');
    let created = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      if (!file.name.toLowerCase().endsWith('.docx')) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const contentHtml = sanitizeArticleHtml(html);
      const title = file.name.replace(/\.docx$/i, '').trim() || `Bài viết ${i + 1}`;
      let slug = slugify(title) || `bai-${Date.now()}-${i}`;
      // tránh trùng slug trong tenant
      const exists = await db.article.findFirst({ where: { slug } });
      if (exists) slug = `${slug}-${Date.now()}`;
      const coverUrl = randomCover ? COVER_PRESETS[i % COVER_PRESETS.length]! : null;

      await db.article.create({
        data: {
          tenantId: session.tenantId,
          title,
          slug,
          contentHtml,
          coverUrl,
          status: publish ? 'published' : 'draft',
          publishedAt: publish ? new Date() : null,
        },
      });
      created++;
    }
    await logAudit(session.userId, 'IMPORT_DOCX', { created });
    revalidateTenantPublic(session.tenantId);
    return created;
  });

  revalidatePath('/admin/tin-tuc');
  redirect(`/admin/tin-tuc?imported=${count}`);
}

// ---------------- Mã giảm giá (Coupon) — PRO, chỉ Quản trị ----------------

export async function upsertCouponAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    if (!(await can(session.tenantId, 'coupons'))) {
      return { error: 'Mã giảm giá chỉ có ở gói Pro.' };
    }
    const data = z
      .object({
        code: z.string().min(1, 'Nhập mã'),
        type: z.enum(['percent', 'fixed']),
        value: z.coerce.number().int().min(0),
        minOrder: z.coerce.number().int().min(0).optional(),
        maxDiscount: z.coerce.number().int().min(0).optional(),
        usageLimit: z.coerce.number().int().min(0).optional(),
        expiresAt: z.string().optional().default(''),
        isActive: z.boolean(),
      })
      .parse({
        code: str(formData, 'code').toUpperCase(),
        type: str(formData, 'type') === 'fixed' ? 'fixed' : 'percent',
        value: num(formData, 'value'),
        minOrder: num(formData, 'minOrder') || undefined,
        maxDiscount: num(formData, 'maxDiscount') || undefined,
        usageLimit: num(formData, 'usageLimit') || undefined,
        expiresAt: str(formData, 'expiresAt'),
        isActive: formData.get('isActive') === 'on',
      });

    const payload = {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder ?? null,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    };
    if (id) {
      await db.coupon.update({ where: { id }, data: payload });
    } else {
      await db.coupon.create({ data: { tenantId: session.tenantId, ...payload } });
    }
    await logAudit(session.userId, id ? 'UPDATE_COUPON' : 'CREATE_COUPON', { code: data.code });
    return {};
  });

  if (result.error) redirect('/admin/ma-giam-gia?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/ma-giam-gia');
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await db.coupon.delete({ where: { id } });
    await logAudit(session.userId, 'DELETE_COUPON', { id });
  });
  revalidatePath('/admin/ma-giam-gia');
}

// ---------------- Onboarding wizard (Mục 14 M4) — chỉ Quản trị ----------------

export async function publishOnboardingAction(formData: FormData): Promise<void> {
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    const brandName = str(formData, 'brandName');
    if (!brandName) return { error: 'Vui lòng nhập tên thương hiệu.' };

    const themeId = str(formData, 'themeId');
    if (themeId) {
      try {
        await assertCanSelectTheme(session.tenantId, themeId);
      } catch (e) {
        if (e instanceof EntitlementError) return { error: e.message };
        throw e;
      }
    }

    // Cập nhật thương hiệu + kích hoạt site (status ACTIVE) + đánh dấu đã onboarding.
    await dbAdmin.tenant.update({
      where: { id: session.tenantId },
      data: {
        brandName,
        logoUrl: str(formData, 'logoUrl') || null,
        primaryColor: str(formData, 'primaryColor') || '#1565C0',
        hotline: str(formData, 'hotline') || null,
        ...(themeId ? { themeId } : {}),
        status: 'ACTIVE',
        onboardedAt: new Date(),
      },
    });

    // Tạo vài tuyến phổ biến đầu tiên (tôn trọng giới hạn gói).
    for (let i = 0; i < 3; i++) {
      const fromName = str(formData, `route_from_${i}`);
      const toName = str(formData, `route_to_${i}`);
      const priceFrom = num(formData, `route_price_${i}`);
      if (!fromName || !toName) continue;
      try {
        await assertWithinLimit(session.tenantId, 'routes');
      } catch (e) {
        if (e instanceof EntitlementError) break; // hết hạn mức -> dừng thêm
        throw e;
      }
      const slug = slugify(`${fromName}-${toName}`) || `tuyen-${i}`;
      const exists = await db.route.findFirst({ where: { slug } });
      if (!exists) {
        await db.route.create({ data: { tenantId: session.tenantId, fromName, toName, slug, priceFrom } });
      }
    }

    await logAudit(session.userId, 'PUBLISH_ONBOARDING', { brandName });
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result.error) redirect('/admin/khoi-tao?error=' + encodeURIComponent(result.error));
  redirect('/admin?published=1');
}

// ---------------- Branding & giao diện — chỉ Quản trị, có gating ----------------

export async function updateBrandingAction(formData: FormData): Promise<void> {
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await dbAdmin.tenant.update({
      where: { id: session.tenantId },
      data: {
        logoUrl: str(formData, 'logoUrl') || null,
        primaryColor: str(formData, 'primaryColor') || '#1565C0',
        hotline: str(formData, 'hotline') || null,
      },
    });
    await logAudit(session.userId, 'UPDATE_BRANDING');
    revalidateTenantPublic(session.tenantId);
  });
  revalidatePath('/admin/giao-dien');
}

// ---------------- Tên miền riêng (Pro tự cấu hình) — chỉ Quản trị ----------------

export async function setCustomDomainAction(formData: FormData): Promise<void> {
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    const res = await setCustomDomain(session.tenantId, str(formData, 'customDomain'));
    if (!res.ok) return { error: res.error };
    await logAudit(session.userId, 'SET_CUSTOM_DOMAIN', { domain: str(formData, 'customDomain') });
    return {};
  });

  if (result.error) redirect('/admin/ten-mien?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/ten-mien');
}

export async function verifyCustomDomainAction(): Promise<void> {
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    const res = await verifyCustomDomain(session.tenantId);
    if (!res.ok) return { error: res.error };
    await logAudit(session.userId, 'VERIFY_CUSTOM_DOMAIN');
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result?.error) redirect('/admin/ten-mien?error=' + encodeURIComponent(result.error));
  redirect('/admin/ten-mien?verified=1');
}

export async function selectThemeAction(formData: FormData): Promise<void> {
  const themeId = str(formData, 'themeId');
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    try {
      await assertCanSelectTheme(session.tenantId, themeId);
    } catch (e) {
      if (e instanceof EntitlementError) return { error: e.message };
      throw e;
    }
    await dbAdmin.tenant.update({ where: { id: session.tenantId }, data: { themeId } });
    await logAudit(session.userId, 'SELECT_THEME', { themeId });
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result.error) redirect('/admin/giao-dien?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/giao-dien');
}

export async function toggleHidePoweredByAction(formData: FormData): Promise<void> {
  const hide = formData.get('hide') === 'on';
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    if (hide) {
      try {
        await assertCanHidePoweredBy(session.tenantId);
      } catch (e) {
        if (e instanceof EntitlementError) return { error: e.message };
        throw e;
      }
    }
    await dbAdmin.tenant.update({ where: { id: session.tenantId }, data: { hidePoweredBy: hide } });
    await logAudit(session.userId, 'TOGGLE_POWERED_BY', { hide });
    revalidateTenantPublic(session.tenantId);
    return {};
  });

  if (result.error) redirect('/admin/giao-dien?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/giao-dien');
}

// ---------------- Cấu hình: Telegram + SEO — chỉ Quản trị ----------------

export async function updateTelegramAction(formData: FormData): Promise<void> {
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await db.tenantSetting.upsert({
      where: { tenantId: session.tenantId },
      update: {
        telegramEnabled: formData.get('telegramEnabled') === 'on',
        telegramToken: str(formData, 'telegramToken') || null,
        telegramChatId: str(formData, 'telegramChatId') || null,
      },
      create: {
        tenantId: session.tenantId,
        telegramEnabled: formData.get('telegramEnabled') === 'on',
        telegramToken: str(formData, 'telegramToken') || null,
        telegramChatId: str(formData, 'telegramChatId') || null,
      },
    });
    await logAudit(session.userId, 'UPDATE_TELEGRAM');
  });
  revalidatePath('/admin/cau-hinh');
}

export async function testTelegramAction(formData: FormData): Promise<void> {
  const token = str(formData, 'telegramToken');
  const chatId = str(formData, 'telegramChatId');
  let ok = false;
  if (token && chatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '✅ Gửi thử từ website xe ghép — cấu hình Telegram hoạt động.' }),
        signal: AbortSignal.timeout(5000),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
  }
  redirect('/admin/cau-hinh?telegram=' + (ok ? 'ok' : 'fail'));
}

export async function updateSeoAction(formData: FormData): Promise<void> {
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    const payload = {
      seoTitle: str(formData, 'seoTitle') || null,
      seoDescription: str(formData, 'seoDescription') || null,
      seoKeywords: str(formData, 'seoKeywords') || null,
      ga4Id: str(formData, 'ga4Id') || null,
      searchConsoleId: str(formData, 'searchConsoleId') || null,
      allowIndex: formData.get('allowIndex') === 'on',
    };
    await db.tenantSetting.upsert({
      where: { tenantId: session.tenantId },
      update: payload,
      create: { tenantId: session.tenantId, ...payload },
    });
    await logAudit(session.userId, 'UPDATE_SEO');
  });
  revalidatePath('/admin/cau-hinh');
}

// ---------------- Nhân viên (Staff) — chỉ Quản trị ----------------

export async function createStaffAction(formData: FormData): Promise<void> {
  const result = await withAdminAction({ adminOnly: true }, async ({ session }): Promise<{ error?: string }> => {
    const data = z
      .object({
        email: z.string().email('Email không hợp lệ'),
        fullName: z.string().optional().default(''),
        password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
        role: z.enum(['TENANT_OPERATOR', 'TENANT_ADMIN']),
      })
      .parse({
        email: str(formData, 'email'),
        fullName: str(formData, 'fullName'),
        password: str(formData, 'password'),
        role: str(formData, 'role') === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_OPERATOR',
      });

    const existing = await db.user.findFirst({ where: { email: data.email } });
    if (existing) return { error: 'Email đã tồn tại trong tenant.' };

    await db.user.create({
      data: {
        tenantId: session.tenantId,
        email: data.email,
        fullName: data.fullName || null,
        password: await hashPassword(data.password),
        role: data.role,
      },
    });
    await logAudit(session.userId, 'CREATE_STAFF', { email: data.email, role: data.role });
    return {};
  });

  if (result.error) redirect('/admin/nhan-vien?error=' + encodeURIComponent(result.error));
  revalidatePath('/admin/nhan-vien');
}

export async function updateStaffRoleAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const role = str(formData, 'role') === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_OPERATOR';
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await db.user.update({ where: { id }, data: { role } });
    await logAudit(session.userId, 'UPDATE_STAFF_ROLE', { id, role });
  });
  revalidatePath('/admin/nhan-vien');
}

export async function setStaffStatusAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const status = str(formData, 'status') === 'locked' ? 'locked' : 'active';
  await withAdminAction({ adminOnly: true }, async ({ session }) => {
    await db.user.update({ where: { id }, data: { status } });
    await logAudit(session.userId, 'SET_STAFF_STATUS', { id, status });
  });
  revalidatePath('/admin/nhan-vien');
}
