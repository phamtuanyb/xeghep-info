/**
 * Tải ảnh lên từ máy (Tenant Admin) — CLAUDE.md Mục 12.B (Nội dung & marketing).
 *
 * Bảo mật:
 *  - Chỉ nhân sự tenant đã đăng nhập (getAdminSession) — ảnh lưu theo tenantId, cô lập.
 *  - Chỉ nhận file ảnh, giới hạn dung lượng; sharp RE-ENCODE sang webp (loại bỏ payload
 *    độc hại nhúng trong ảnh) + resize giới hạn bề rộng để tối ưu tải trang.
 *  - Tên file ngẫu nhiên (randomUUID) -> không đoán/đè được.
 *
 * Lưu vào public/uploads/<tenantId>/<uuid>.webp và trả URL phục vụ tĩnh.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB ảnh gốc
const MAX_WIDTH = 1600;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu tệp ảnh.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Chỉ chấp nhận tệp ảnh.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Ảnh tối đa 8MB.' }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  let webp: Buffer;
  try {
    webp = await sharp(input)
      .rotate() // tôn trọng EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Tệp không phải ảnh hợp lệ.' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', session.tenantId);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, name), webp);

  const url = `/uploads/${session.tenantId}/${name}`;
  return NextResponse.json({ url });
}
