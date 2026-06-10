/**
 * Kiểm tra & tính mã giảm giá Ở SERVER (CLAUDE.md Mục 12.A). PHẢI chạy trong tenant
 * context (db tự lọc tenant) — mã của tenant này không áp cho tenant khác.
 * Tính năng coupon là PRO (kiểm tra entitlement ở nơi gọi nếu cần).
 */
import { db } from './db';

export type CouponResult =
  | { ok: true; code: string; discount: number; finalAmount: number }
  | { ok: false; reason: string };

/**
 * @param code     mã giảm giá người dùng nhập
 * @param orderAmount tổng tiền trước giảm (VND)
 */
export async function validateCoupon(code: string, orderAmount: number): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, reason: 'Chưa nhập mã giảm giá.' };

  const coupon = await db.coupon.findFirst({ where: { code: normalized } });
  if (!coupon) return { ok: false, reason: 'Mã giảm giá không tồn tại.' };
  if (!coupon.isActive) return { ok: false, reason: 'Mã giảm giá đã bị tắt.' };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'Mã giảm giá đã hết hạn.' };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: 'Mã giảm giá đã hết lượt sử dụng.' };
  }
  if (coupon.minOrder != null && orderAmount < coupon.minOrder) {
    return { ok: false, reason: `Đơn tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}₫ để dùng mã này.` };
  }

  let discount = coupon.type === 'percent' ? Math.round((orderAmount * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, orderAmount);

  return { ok: true, code: normalized, discount, finalAmount: orderAmount - discount };
}

/** Tăng số lượt đã dùng sau khi đặt thành công. */
export async function consumeCoupon(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  await db.coupon.updateMany({ where: { code: normalized }, data: { usedCount: { increment: 1 } } });
}
