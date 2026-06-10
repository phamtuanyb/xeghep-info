'use server';

/**
 * Đổi mã kích hoạt -> tạo tenant (CLAUDE.md Mục 14 PHA 2). Trang công khai cấp nền tảng
 * (không cần tenant context). Rate-limit theo IP chống lạm dụng.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { redeemActivationCode } from '@/lib/activation';
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export async function redeemAction(formData: FormData): Promise<void> {
  const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'anon';
  if (!(await rateLimit(`redeem:${ip}`, 8, 60)).ok) {
    redirect('/kich-hoat?error=' + encodeURIComponent(RATE_LIMIT_MESSAGE));
  }

  const result = await redeemActivationCode({
    code: str(formData, 'code'),
    brandName: str(formData, 'brandName'),
    slug: str(formData, 'slug'),
    ownerName: str(formData, 'ownerName'),
    ownerEmail: str(formData, 'ownerEmail'),
    ownerPassword: str(formData, 'ownerPassword'),
  });

  if (!result.ok) {
    redirect('/kich-hoat?error=' + encodeURIComponent(result.error));
  }
  redirect('/kich-hoat/thanh-cong?slug=' + encodeURIComponent(result.slug));
}
