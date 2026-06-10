/**
 * Rate-limit bằng Redis (CLAUDE.md Mục 1.5, 5, 14 PHA 2). Cửa sổ cố định INCR+EXPIRE.
 * Áp cho thao tác nhạy cảm: đặt xe/lead, đăng nhập, đăng ký, quên mật khẩu.
 *
 * - Dùng chung Redis giữa nhiều instance app -> giới hạn chính xác khi scale ngang.
 * - FAIL-OPEN: nếu không cấu hình REDIS_URL hoặc Redis lỗi -> CHO QUA (không chặn
 *   người dùng thật vì hạ tầng phụ trợ trục trặc). Chỉ chạy ở Node runtime (không Edge).
 */
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { __redis?: Redis | null };

function getRedis(): Redis | null {
  if (globalForRedis.__redis !== undefined) return globalForRedis.__redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.__redis = null;
    return null;
  }
  try {
    const client = new Redis(url, {
      // maxRetriesPerRequest 1 + connectTimeout ngắn -> fail-fast khi Redis chết
      // (rateLimit bắt lỗi -> fail-open). enableOfflineQueue mặc định (true) để
      // lệnh đầu tiên CHỜ kết nối xong thay vì rớt ngay khi đang connect.
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    client.on('error', () => {
      /* nuốt lỗi kết nối để không spam log; rateLimit sẽ fail-open */
    });
    globalForRedis.__redis = client;
  } catch {
    globalForRedis.__redis = null;
  }
  return globalForRedis.__redis;
}

export type RateLimitResult = { ok: boolean; remaining: number };

/**
 * @param key       định danh (vd `lead:<ip>`, `login:<ip>`)
 * @param limit     số lần tối đa trong cửa sổ
 * @param windowSec độ dài cửa sổ (giây)
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return { ok: true, remaining: limit };

  try {
    const k = `rl:${key}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { ok: true, remaining: limit }; // fail-open khi Redis lỗi
  }
}

/** Thông báo tiếng Việt khi vượt giới hạn. */
export const RATE_LIMIT_MESSAGE = 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';

/** Đóng kết nối Redis (dùng cho dọn dẹp test). */
export async function disconnectRedis(): Promise<void> {
  if (globalForRedis.__redis) {
    try {
      await globalForRedis.__redis.quit();
    } catch {
      /* ignore */
    }
    globalForRedis.__redis = undefined;
  }
}
