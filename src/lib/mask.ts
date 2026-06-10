/**
 * Che dữ liệu nhạy cảm ở khu công khai (CLAUDE.md Mục 1.5 & 12.A).
 * SĐT và biển số chỉ hiển thị một phần cho khách; thông tin đầy đủ chỉ ở khu quản trị.
 */

/** 0901234567 -> 0901***567 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\s+/g, '');
  if (digits.length <= 4) return '***';
  const head = digits.slice(0, 4);
  const tail = digits.slice(-3);
  return `${head}***${tail}`;
}

/** 21A-111.11 -> 21A-***.11 (giữ đầu tỉnh + 2 số cuối) */
export function maskPlate(plate: string | null | undefined): string {
  if (!plate) return '';
  const trimmed = plate.trim();
  if (trimmed.length <= 4) return '****';
  const head = trimmed.slice(0, 3);
  const tail = trimmed.slice(-2);
  return `${head}-***.${tail}`;
}
