/**
 * Kho ảnh bài viết — TÁCH RIÊNG THEO TỪNG WEBSITE (tenant).
 * Mỗi tenant một thư mục: public/article-images/<tenantId>/
 * Admin tự tải ảnh lên kho của site mình; khi đăng/import bài, tự lấy NGẪU NHIÊN
 * ảnh bìa + 1 ảnh trong bài TỪ ĐÚNG KHO CỦA SITE ĐÓ (không lẫn sang web khác).
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public', 'article-images');
const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Thư mục ảnh của một tenant (chỉ nhận id an toàn — cuid alphanumeric). */
export function articleImagesDir(tenantId: string): string {
  const safe = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(ROOT, safe);
}

/** Danh sách URL ảnh trong kho của tenant (đường dẫn phục vụ tĩnh). */
export function listArticleImages(tenantId: string): string[] {
  const safe = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  try {
    return readdirSync(articleImagesDir(tenantId))
      .filter((f) => IMG_RE.test(f))
      .map((f) => `/article-images/${safe}/${f}`);
  } catch {
    return [];
  }
}

/** Lấy ngẫu nhiên `n` ảnh (ưu tiên KHÁC NHAU) từ kho của tenant. */
export function pickRandomArticleImages(tenantId: string, n: number): string[] {
  const all = listArticleImages(tenantId);
  if (all.length === 0) return [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return Array.from({ length: n }, (_, i) => shuffled[i % shuffled.length]!);
}

/** Chèn 1 ảnh vào thân bài (sau đoạn <p> đầu, hoặc nối cuối) NẾU bài chưa có ảnh nào. */
export function insertBodyImageIfNone(html: string, imageUrl: string): string {
  if (!imageUrl || /<img\b/i.test(html)) return html;
  const fig = `<figure><img src="${imageUrl}" alt="" /></figure>`;
  const m = html.match(/<\/p>/i);
  if (m && m.index !== undefined) {
    const pos = m.index + m[0].length;
    return html.slice(0, pos) + fig + html.slice(pos);
  }
  return html + fig;
}
