/**
 * Kho ảnh bài viết theo từng website (Tenant Admin) — CLAUDE.md Mục 12.B.
 * Ảnh lưu tại public/article-images/<tenantId>/ (mỗi site một thư mục, tách biệt).
 *
 *  - GET    : liệt kê ảnh trong kho của site hiện tại.
 *  - POST   : tải ảnh lên (sharp re-encode -> webp, resize) vào kho của site.
 *  - DELETE : xóa 1 ảnh (chỉ trong kho của chính site, chống path traversal).
 *
 * Bảo mật: chỉ nhân sự tenant đã đăng nhập; mọi thao tác khóa theo session.tenantId.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getAdminSession } from '@/lib/admin-auth';
import { articleImagesDir, listArticleImages } from '@/lib/article-images';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 1600;

export async function GET(): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  return NextResponse.json({ images: listArticleImages(session.tenantId) });
}

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
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu tệp ảnh.' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Chỉ chấp nhận tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Ảnh tối đa 8MB.' }, { status: 400 });

  const input = Buffer.from(await file.arrayBuffer());
  let webp: Buffer;
  try {
    webp = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    return NextResponse.json({ error: 'Tệp không phải ảnh hợp lệ.' }, { status: 400 });
  }

  const dir = articleImagesDir(session.tenantId);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, name), webp);

  const safeTenant = session.tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  return NextResponse.json({ url: `/article-images/${safeTenant}/${name}` });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });

  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }
  const url = body.url ?? '';
  const fileName = path.basename(url); // chỉ lấy tên file, chống path traversal
  const safeTenant = session.tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  // Chỉ cho xóa ảnh đúng định dạng URL kho của CHÍNH site này.
  if (url !== `/article-images/${safeTenant}/${fileName}` || !/^[\w.-]+\.(jpe?g|png|webp|gif|avif)$/i.test(fileName)) {
    return NextResponse.json({ error: 'Ảnh không hợp lệ.' }, { status: 400 });
  }
  try {
    await unlink(path.join(articleImagesDir(session.tenantId), fileName));
  } catch {
    /* không có file -> coi như đã xóa */
  }
  return NextResponse.json({ ok: true });
}
