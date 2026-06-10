/**
 * Tenant context theo từng request (CLAUDE.md Mục 3.3 & 8).
 *
 * Dùng AsyncLocalStorage để lưu tenantId của request hiện tại. Prisma extension
 * trong db.ts đọc giá trị này để TỰ ĐỘNG lọc theo tenant — lập trình viên KHÔNG
 * cần (và không được) tự thêm điều kiện tenantId ở từng query.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

type TenantStore = {
  tenantId: string;
};

// QUAN TRỌNG: cache AsyncLocalStorage trên globalThis. Next.js có thể nạp module này
// ở nhiều bundle server khác nhau -> nếu mỗi lần `new AsyncLocalStorage()` thì run()
// và getStore() đọc/ghi 2 instance khác nhau -> mất tenant context (fail-closed throw).
// Giống cách db.ts cache Prisma client.
const globalForTenant = globalThis as unknown as { __tenantStorage?: AsyncLocalStorage<TenantStore> };
const tenantStorage = globalForTenant.__tenantStorage ?? new AsyncLocalStorage<TenantStore>();
globalForTenant.__tenantStorage = tenantStorage;

/**
 * Chạy `fn` trong ngữ cảnh của một tenant cụ thể. Mọi truy vấn Prisma (qua client
 * đã cô lập) khởi tạo bên trong `fn` sẽ tự động bị lọc theo `tenantId` này.
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantStorage.run({ tenantId }, fn);
}

/** Lấy tenantId hiện tại, hoặc undefined nếu đang ngoài tenant context. */
export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

/** Lấy tenantId hiện tại, ném lỗi nếu thiếu (fail-closed). */
export function getTenantIdOrThrow(): string {
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error('Thiếu tenant context: thao tác này phải chạy trong runWithTenant().');
  }
  return tenantId;
}
