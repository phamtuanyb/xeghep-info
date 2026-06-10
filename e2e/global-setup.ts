/**
 * Global setup cho e2e: xóa các khóa rate-limit `rl:*` trong Redis để lần chạy mới
 * không bị ảnh hưởng bởi bộ đếm còn sót (e2e dùng chung Redis với môi trường dev).
 */
import 'dotenv/config';
import Redis from 'ioredis';

export default async function globalSetup(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) return;
  const redis = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
  redis.on('error', () => {});
  try {
    const keys = await redis.keys('rl:*');
    if (keys.length) await redis.del(...keys);
  } catch {
    /* Redis không sẵn sàng -> bỏ qua */
  }
  await redis.quit();
}
