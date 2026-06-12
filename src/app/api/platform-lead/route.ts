/**
 * Nhận lead từ trang giới thiệu nền tảng (xeghep.info) -> gửi về Telegram của MKT.
 * Công khai (không cần đăng nhập) nhưng có rate-limit chống spam. Validate Zod.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { sendPlatformLead } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anon';
  const rl = await rateLimit(`platform-lead:${ip}`, 5, 60);
  if (!rl.ok) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1, 'Nhập họ tên'),
      phone: z.string().trim().min(8, 'Số điện thoại không hợp lệ'),
      route: z.string().trim().optional().default(''),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Vui lòng nhập họ tên và số điện thoại.' }, { status: 400 });
  }

  const device = req.headers.get('user-agent');
  const result = await sendPlatformLead({ ...parsed.data, ip: ip === 'anon' ? null : ip, device });

  if (result === 'unconfigured') {
    return NextResponse.json({ error: 'Hệ thống chưa cấu hình Telegram nhận lead. Vui lòng liên hệ qua hotline.' }, { status: 503 });
  }
  if (!result) {
    return NextResponse.json({ error: 'Gửi thông tin thất bại, vui lòng thử lại hoặc gọi hotline.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
