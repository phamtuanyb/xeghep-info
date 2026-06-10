/**
 * Test rate-limit Redis (CLAUDE.md Mục 14 PHA 2). Yêu cầu REDIS_URL trỏ tới Redis chạy.
 * Nếu không có Redis -> rateLimit fail-open (luôn ok) và test xác nhận hành vi đó.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { rateLimit, disconnectRedis } from '@/lib/rate-limit';

const hasRedis = !!process.env.REDIS_URL;

afterAll(async () => {
  await disconnectRedis();
});

describe('rateLimit', () => {
  it('chặn sau khi vượt giới hạn trong cửa sổ', async () => {
    const key = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const limit = 3;
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(await rateLimit(key, limit, 60));
    }

    if (!hasRedis) {
      // Không có Redis -> fail-open: tất cả đều ok.
      expect(results.every((r) => r.ok)).toBe(true);
      return;
    }

    // 3 lần đầu ok, 2 lần sau bị chặn.
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3]!.ok).toBe(false);
    expect(results[4]!.ok).toBe(false);
    expect(results[0]!.remaining).toBe(2);
  });

  it('key khác nhau đếm độc lập', async () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    const r1 = await rateLimit(a, 1, 60);
    const r2 = await rateLimit(b, 1, 60);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });
});
