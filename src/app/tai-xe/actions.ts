'use server';

/**
 * Server Actions cổng tài xế (CLAUDE.md Mục 12.C). Zod -> check role DRIVER
 * (withDriverAction) -> entitlement -> db cô lập tenant.
 *
 * Gating tự đăng chuyến: FREE = chủ xe thêm chuyến giúp (tài xế chỉ xem);
 * PRO = tài xế tự đăng chuyến (kiểm tra `driverSelfServe` ở SERVER).
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withPublicTenant } from '@/lib/public-tenant';
import { withDriverAction } from '@/lib/driver-auth';
import { getSession, verifyTenantCredentials, setSessionCookie, clearSessionCookie, verifyPassword, hashPassword } from '@/lib/auth';
import { can } from '@/lib/entitlement';
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function num(formData: FormData, key: string): number {
  return Number(str(formData, key)) || 0;
}

// ---------------- Đăng nhập / Đăng xuất ----------------

export async function driverLoginAction(formData: FormData): Promise<void> {
  const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'anon';
  if (!(await rateLimit(`driver-login:${ip}`, 10, 60)).ok) {
    redirect('/tai-xe/dang-nhap?error=' + encodeURIComponent(RATE_LIMIT_MESSAGE));
  }
  const email = str(formData, 'email');
  const password = str(formData, 'password');

  const result = await withPublicTenant(
    async (tenant): Promise<{ ok: boolean; payload?: { userId: string; role: string; tenantId: string }; reason?: string }> => {
      const login = await verifyTenantCredentials(email, password);
      if (!login.ok) return { ok: false, reason: login.reason === 'locked' ? 'Tài khoản đã bị khóa.' : 'Email hoặc mật khẩu không đúng.' };
      if (login.payload.role !== 'DRIVER') return { ok: false, reason: 'Tài khoản không phải tài xế.' };
      return { ok: true, payload: { userId: login.payload.userId, role: login.payload.role, tenantId: tenant.id } };
    }
  );

  if (!result.ok) redirect('/tai-xe/dang-nhap?error=' + encodeURIComponent(result.reason ?? 'Đăng nhập thất bại.'));
  await setSessionCookie(result.payload!);
  redirect('/tai-xe');
}

export async function driverLogoutAction(): Promise<void> {
  clearSessionCookie();
  redirect('/tai-xe/dang-nhap');
}

// ---------------- Hồ sơ KYC ----------------

export async function updateKycAction(formData: FormData): Promise<void> {
  await withDriverAction(async ({ driver }) => {
    await db.driver.update({
      where: { id: driver.id },
      data: {
        cccdUrl: str(formData, 'cccdUrl') || null,
        licenseUrl: str(formData, 'licenseUrl') || null,
        registryUrl: str(formData, 'registryUrl') || null,
        avatarUrl: str(formData, 'avatarUrl') || null,
        kycStatus: 'pending', // gửi lại -> chờ admin duyệt
      },
    });
  });
  revalidatePath('/tai-xe/kyc');
  redirect('/tai-xe/kyc?submitted=1');
}

// ---------------- Trang cá nhân + đổi mật khẩu ----------------

export async function updateDriverProfileAction(formData: FormData): Promise<void> {
  await withDriverAction(async ({ driver }) => {
    await db.driver.update({
      where: { id: driver.id },
      data: {
        fullName: str(formData, 'fullName') || driver.fullName as string,
        carType: str(formData, 'carType') || null,
        carColor: str(formData, 'carColor') || null,
        plateNumber: str(formData, 'plateNumber') || null,
      },
    });
  });
  revalidatePath('/tai-xe/ho-so');
  redirect('/tai-xe/ho-so?updated=1');
}

export async function changeDriverPasswordAction(formData: FormData): Promise<void> {
  const current = str(formData, 'currentPassword');
  const next = str(formData, 'newPassword');
  if (next.length < 6) redirect('/tai-xe/ho-so?error=' + encodeURIComponent('Mật khẩu mới tối thiểu 6 ký tự.'));

  const session = await getSession();
  const result = await withDriverAction(async (): Promise<{ error?: string }> => {
    const user = await db.user.findFirst({ where: { id: session!.userId } });
    if (!user) return { error: 'Không tìm thấy tài khoản.' };
    if (!(await verifyPassword(current, user.password))) return { error: 'Mật khẩu hiện tại không đúng.' };
    await db.user.update({ where: { id: user.id }, data: { password: await hashPassword(next) } });
    return {};
  });

  if (result.error) redirect('/tai-xe/ho-so?error=' + encodeURIComponent(result.error));
  redirect('/tai-xe/ho-so?updated=1');
}

// ---------------- Tự đăng chuyến (PRO) ----------------

export async function createMyTripAction(formData: FormData): Promise<void> {
  const result = await withDriverAction(async ({ session, driver }): Promise<{ error?: string }> => {
    if (!(await can(session.tenantId, 'driverSelfServe'))) {
      return { error: 'Gói Free: chủ xe sẽ thêm chuyến giúp bạn. Nâng cấp Pro để tự đăng chuyến.' };
    }
    const data = z
      .object({
        routeId: z.string().min(1, 'Chọn tuyến'),
        departAt: z.string().min(1, 'Chọn giờ'),
        seatsTotal: z.coerce.number().int().min(1),
        pricePerSeat: z.coerce.number().int().min(0),
        serviceType: z.string().min(1),
      })
      .parse({
        routeId: str(formData, 'routeId'),
        departAt: str(formData, 'departAt'),
        seatsTotal: num(formData, 'seatsTotal'),
        pricePerSeat: num(formData, 'pricePerSeat'),
        serviceType: str(formData, 'serviceType') || 'ghep_1',
      });

    await db.trip.create({
      data: {
        tenantId: session.tenantId,
        driverId: driver.id,
        routeId: data.routeId,
        departAt: new Date(data.departAt),
        seatsTotal: data.seatsTotal,
        seatsLeft: data.seatsTotal,
        pricePerSeat: data.pricePerSeat,
        serviceType: data.serviceType,
        status: 'open',
      },
    });
    return {};
  });

  if (result.error) redirect('/tai-xe/chuyen?error=' + encodeURIComponent(result.error));
  revalidatePath('/tai-xe/chuyen');
}

export async function deleteMyTripAction(formData: FormData): Promise<void> {
  const id = str(formData, 'id');
  const result = await withDriverAction(async ({ session, driver }): Promise<{ error?: string }> => {
    if (!(await can(session.tenantId, 'driverSelfServe'))) {
      return { error: 'Bạn không có quyền xóa chuyến.' };
    }
    // Chỉ xóa chuyến của chính mình.
    await db.trip.deleteMany({ where: { id, driverId: driver.id } });
    return {};
  });

  if (result.error) redirect('/tai-xe/chuyen?error=' + encodeURIComponent(result.error));
  revalidatePath('/tai-xe/chuyen');
}
