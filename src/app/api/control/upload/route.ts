/**
 * Tải ảnh cấp NỀN TẢNG (Control Plane) — dùng cho ảnh "Mẫu giao diện" trên trang gốc.
 * Chỉ nhân sự Control Plane đã đăng nhập. sharp -> webp, lưu public/landing/.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getControlSession } from '@/lib/control-auth';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 1600;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getControlSession();
  if (!session) return NextResponse.json({ error: 'Bạn cần đăng nhập Control Plane.' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu tệp ảnh.' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Chỉ chấp nhận tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Ảnh tối đa 8MB.' }, { status: 400 });

  const input = Buffer.from(await file.arrayBuffer());
  let webp: Buffer;
  try {
    webp = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ error: 'Tệp không phải ảnh hợp lệ.' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'public', 'landing');
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, name), webp);

  return NextResponse.json({ url: `/landing/${name}` });
}
