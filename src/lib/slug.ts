/**
 * Tạo slug SEO từ tiếng Việt có dấu: bỏ dấu, thường hóa, nối bằng gạch ngang.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh (combining marks)
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
