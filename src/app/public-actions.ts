'use server';

/**
 * Server Actions của Public site (CLAUDE.md Mục 12.A). Mọi action chạy TRONG tenant
 * context (db cô lập) qua withPublicTenant. Validate Zod; che/log an toàn.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { db, dbAdmin } from '@/lib/db';
import { withPublicTenant } from '@/lib/public-tenant';
import {
  hashPassword,
  verifyPassword,
  verifyTenantCredentials,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  signResetToken,
  verifyResetToken,
} from '@/lib/auth';
import { can } from '@/lib/entitlement';
import { validateCoupon, consumeCoupon } from '@/lib/coupon';
import { sendLeadNotification } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Chỉ cho phép redirect tới ĐƯỜNG DẪN NỘI BỘ (chống open-redirect). Giá trị từ client
 * phải bắt đầu bằng một dấu '/' (không phải '//' protocol-relative, không phải '/\').
 * Khác đi -> dùng fallback.
 */
function safeRedirect(value: string, fallback: string): string {
  return /^\/(?![/\\])/.test(value) ? value : fallback;
}

function reqMeta(): { ip: string | null; device: string | null } {
  const h = headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || h.get('x-real-ip') || null;
  const device = h.get('user-agent') || null;
  return { ip, device };
}

/** Chặn spam thao tác nhạy cảm theo IP. Vượt giới hạn -> redirect tới `onLimit`. */
async function guardRate(action: string, limit: number, windowSec: number, onLimit: string): Promise<void> {
  const ip = reqMeta().ip ?? 'anon';
  const rl = await rateLimit(`${action}:${ip}`, limit, windowSec);
  if (!rl.ok) redirect(onLimit + (onLimit.includes('?') ? '&' : '?') + 'error=' + encodeURIComponent(RATE_LIMIT_MESSAGE));
}

// ---------------- Lead (để lại thông tin khi không có chuyến phù hợp) ----------------

/** Mã loại dịch vụ -> nhãn tiếng Việt (để lưu Booking & hiển thị Telegram cho dễ đọc). */
const SERVICE_LABELS: Record<string, string> = {
  ghep_1: '1 ghế ghép',
  ghep_2: '2 ghế ghép',
  bao_5: 'Bao xe 5 chỗ',
  bao_7: 'Bao xe 7 chỗ',
  gui_do: 'Gửi đồ',
};

export async function createLeadAction(formData: FormData): Promise<void> {
  // redirectTo: nơi quay lại khi lỗi/thành công (mặc định /tim-chuyen). Form hero ở
  // trang chủ truyền '/' để giữ khách ở lại trang chủ sau khi gửi.
  const redirectTo = safeRedirect(str(formData, 'redirectTo'), '/tim-chuyen');
  const sep = redirectTo.includes('?') ? '&' : '?';
  await guardRate('lead', 15, 60, redirectTo);
  const parsed = z
    .object({
      pickupAddr: z.string().min(1, 'Nhập điểm đón'),
      dropoffAddr: z.string().min(1, 'Nhập nơi trả khách'),
      departDate: z.string().optional().default(''),
      serviceType: z.string().optional().default(''),
      customerName: z.string().min(1, 'Nhập họ tên'),
      customerPhone: z.string().min(8, 'Số điện thoại không hợp lệ'),
    })
    .safeParse({
      pickupAddr: str(formData, 'pickupAddr'),
      dropoffAddr: str(formData, 'dropoffAddr'),
      departDate: str(formData, 'departDate'),
      serviceType: str(formData, 'serviceType'),
      customerName: str(formData, 'customerName'),
      customerPhone: str(formData, 'customerPhone'),
    });

  if (!parsed.success) {
    redirect(redirectTo + sep + 'error=' + encodeURIComponent('Vui lòng nhập đầy đủ điểm đón, nơi trả khách, họ tên và số điện thoại.'));
  }
  const data = parsed.data;
  const serviceLabel = data.serviceType ? SERVICE_LABELS[data.serviceType] ?? data.serviceType : null;
  const { ip, device } = reqMeta();

  await withPublicTenant(async (tenant) => {
    await db.booking.create({
      // tenantId truyền tường minh để khớp kiểu Prisma; extension cô lập vẫn ghi đè
      // về tenant hiện tại nên không thể tạo nhầm sang tenant khác.
      data: {
        tenantId: tenant.id,
        // fromName/toName lưu cùng giá trị điểm đón/trả khách để các màn cũ hiển thị đúng.
        fromName: data.pickupAddr,
        toName: data.dropoffAddr,
        pickupAddr: data.pickupAddr,
        dropoffAddr: data.dropoffAddr,
        departDate: data.departDate ? new Date(data.departDate) : null,
        serviceType: serviceLabel,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        status: 'new',
        ip,
        device,
      },
    });
    await sendLeadNotification({
      brandName: tenant.brandName,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      fromName: data.pickupAddr,
      toName: data.dropoffAddr,
      departDate: data.departDate || null,
      serviceType: serviceLabel,
      ip,
      device,
    });
  });

  // Thành công -> trang thông báo riêng (rõ ràng, không phụ thuộc trang nguồn).
  redirect('/dat-xe-thanh-cong');
}

// ---------------- Đặt chỗ từ chi tiết chuyến ----------------

export async function createBookingAction(formData: FormData): Promise<void> {
  const tripId = str(formData, 'tripId');
  await guardRate('booking', 15, 60, `/chuyen/${tripId}`);
  const parsed = z
    .object({
      customerName: z.string().min(1, 'Nhập họ tên'),
      customerPhone: z.string().min(8, 'Số điện thoại không hợp lệ'),
      seats: z.coerce.number().int().min(1).max(20),
      couponCode: z.string().optional().default(''),
      note: z.string().optional().default(''),
    })
    .safeParse({
      customerName: str(formData, 'customerName'),
      customerPhone: str(formData, 'customerPhone'),
      seats: str(formData, 'seats') || 1,
      couponCode: str(formData, 'couponCode'),
      note: str(formData, 'note'),
    });

  if (!parsed.success) {
    redirect(`/chuyen/${tripId}?error=` + encodeURIComponent('Vui lòng nhập đầy đủ thông tin.'));
  }
  const data = parsed.data;
  const { ip, device } = reqMeta();
  const session = await getSession();

  const result = await withPublicTenant(async (tenant): Promise<{ bookingId?: string; error?: string }> => {
    const trip = await db.trip.findUnique({ where: { id: tripId }, include: { route: true } });
    if (!trip) return { error: 'Chuyến không tồn tại hoặc đã đóng.' };

    const seats = Math.min(Math.max(1, data.seats), Math.max(1, trip.seatsLeft));
    const orderAmount = trip.pricePerSeat * seats;

    // Mã giảm giá (KIỂM TRA Ở SERVER) — chỉ áp khi gói bật tính năng coupons.
    let couponCode: string | null = null;
    if (data.couponCode) {
      const couponsEnabled = await can(tenant.id, 'coupons');
      if (!couponsEnabled) return { error: 'Mã giảm giá không khả dụng cho website này.' };
      const cres = await validateCoupon(data.couponCode, orderAmount);
      if (!cres.ok) return { error: cres.reason };
      couponCode = cres.code;
    }

    const customerId =
      session && session.role === 'CUSTOMER' && session.tenantId === tenant.id ? session.userId : null;

    const booking = await db.booking.create({
      data: {
        tenantId: tenant.id, // extension vẫn ghi đè; truyền để khớp kiểu Prisma
        tripId: trip.id,
        customerId,
        fromName: trip.route.fromName,
        toName: trip.route.toName,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        seats,
        serviceType: trip.serviceType,
        couponCode,
        note: data.note || null,
        status: 'new',
        ip,
        device,
      },
    });

    if (couponCode) await consumeCoupon(couponCode);

    await sendLeadNotification({
      brandName: tenant.brandName,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      fromName: trip.route.fromName,
      toName: trip.route.toName,
      seats,
      serviceType: trip.serviceType,
      note: data.note,
      ip,
      device,
    });

    return { bookingId: booking.id };
  });

  if (result.error) {
    redirect(`/chuyen/${tripId}?error=` + encodeURIComponent(result.error));
  }
  redirect(`/dat-cho-thanh-cong?id=${result.bookingId}`);
}

// ---------------- Tài khoản khách ----------------

export async function registerAction(formData: FormData): Promise<void> {
  await guardRate('register', 5, 60, '/tai-khoan/dang-ky');
  const parsed = z
    .object({
      fullName: z.string().min(1, 'Nhập họ tên'),
      email: z.string().email('Email không hợp lệ'),
      phone: z.string().optional().default(''),
      password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    })
    .safeParse({
      fullName: str(formData, 'fullName'),
      email: str(formData, 'email'),
      phone: str(formData, 'phone'),
      password: str(formData, 'password'),
    });

  if (!parsed.success) {
    redirect('/tai-khoan/dang-ky?error=' + encodeURIComponent(parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ.'));
  }
  const data = parsed.data;

  const result = await withPublicTenant(
    async (tenant): Promise<{ userId?: string; role?: string; tenantId?: string; error?: string }> => {
      const existing = await db.user.findFirst({ where: { email: data.email } });
      if (existing) return { error: 'Email đã được đăng ký.' };
      const user = await db.user.create({
        data: {
          tenantId: tenant.id, // extension vẫn ghi đè; truyền để khớp kiểu Prisma
          email: data.email,
          password: await hashPassword(data.password),
          fullName: data.fullName,
          phone: data.phone || null,
          role: 'CUSTOMER',
        },
      });
      return { userId: user.id, role: user.role, tenantId: tenant.id };
    }
  );

  if (result.error) {
    redirect('/tai-khoan/dang-ky?error=' + encodeURIComponent(result.error));
  }
  await setSessionCookie({ userId: result.userId!, role: result.role!, tenantId: result.tenantId! });
  redirect('/tai-khoan/ho-so');
}

export async function loginCustomerAction(formData: FormData): Promise<void> {
  await guardRate('login', 10, 60, '/tai-khoan/dang-nhap');
  const email = str(formData, 'email');
  const password = str(formData, 'password');

  const result = await withPublicTenant(async (tenant): Promise<{ ok: boolean; payload?: { userId: string; role: string; tenantId: string }; reason?: string }> => {
    const login = await verifyTenantCredentials(email, password);
    if (!login.ok) {
      return { ok: false, reason: login.reason === 'locked' ? 'Tài khoản đã bị khóa.' : 'Email hoặc mật khẩu không đúng.' };
    }
    if (login.payload.role !== 'CUSTOMER') {
      return { ok: false, reason: 'Tài khoản này không phải tài khoản khách.' };
    }
    return { ok: true, payload: { userId: login.payload.userId, role: login.payload.role, tenantId: tenant.id } };
  });

  if (!result.ok) {
    redirect('/tai-khoan/dang-nhap?error=' + encodeURIComponent(result.reason ?? 'Đăng nhập thất bại.'));
  }
  await setSessionCookie(result.payload!);
  redirect('/tai-khoan/ho-so');
}

export async function logoutCustomerAction(): Promise<void> {
  clearSessionCookie();
  redirect('/');
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  await guardRate('forgot', 5, 60, '/tai-khoan/quen-mat-khau');
  const email = str(formData, 'email');

  await withPublicTenant(async (tenant) => {
    const user = await db.user.findFirst({ where: { email, role: 'CUSTOMER' } });
    if (user) {
      const token = await signResetToken(user.id, tenant.id);
      const base = process.env.APP_BASE_URL ?? '';
      const link = `${base}/tai-khoan/dat-lai-mat-khau?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: email,
        subject: `Đặt lại mật khẩu — ${tenant.brandName}`,
        html: `<p>Nhấn vào liên kết để đặt lại mật khẩu (hết hạn sau 1 giờ):</p><p><a href="${link}">${link}</a></p>`,
        text: `Đặt lại mật khẩu: ${link}`,
      });
    }
  });

  // Luôn báo thành công (không tiết lộ email có tồn tại hay không).
  redirect('/tai-khoan/dang-nhap?reset=sent');
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const token = str(formData, 'token');
  const password = str(formData, 'password');
  if (password.length < 6) {
    redirect(`/tai-khoan/dat-lai-mat-khau?token=${encodeURIComponent(token)}&error=` + encodeURIComponent('Mật khẩu tối thiểu 6 ký tự.'));
  }

  const payload = await verifyResetToken(token);
  if (!payload) {
    redirect('/tai-khoan/quen-mat-khau?error=' + encodeURIComponent('Liên kết không hợp lệ hoặc đã hết hạn.'));
  }

  // Cập nhật theo userId đã xác thực trong token (dbAdmin: đã xác thực chủ thể).
  await dbAdmin.user.update({ where: { id: payload!.userId }, data: { password: await hashPassword(password) } });
  redirect('/tai-khoan/dang-nhap?reset=done');
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const current = str(formData, 'currentPassword');
  const next = str(formData, 'newPassword');
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    redirect('/tai-khoan/dang-nhap');
  }
  if (next.length < 6) {
    redirect('/tai-khoan/ho-so?error=' + encodeURIComponent('Mật khẩu mới tối thiểu 6 ký tự.'));
  }

  const result = await withPublicTenant(async (): Promise<{ error?: string }> => {
    const user = await db.user.findFirst({ where: { id: session!.userId } });
    if (!user) return { error: 'Không tìm thấy tài khoản.' };
    const valid = await verifyPassword(current, user.password);
    if (!valid) return { error: 'Mật khẩu hiện tại không đúng.' };
    await db.user.update({ where: { id: user.id }, data: { password: await hashPassword(next) } });
    return {};
  });

  if (result.error) {
    redirect('/tai-khoan/ho-so?error=' + encodeURIComponent(result.error));
  }
  redirect('/tai-khoan/ho-so?updated=1');
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    redirect('/tai-khoan/dang-nhap');
  }
  const fullName = str(formData, 'fullName');
  const phone = str(formData, 'phone');

  await withPublicTenant(async () => {
    await db.user.update({ where: { id: session!.userId }, data: { fullName: fullName || null, phone: phone || null } });
  });
  redirect('/tai-khoan/ho-so?updated=1');
}
