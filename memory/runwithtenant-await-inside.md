---
name: runwithtenant-await-inside
description: Tenant DB ops MUST be awaited inside runWithTenant() or isolation context is lost
metadata:
  type: project
---

Trong dự án Xe Ghép white-label, `db` (Prisma client cô lập tenant ở [src/lib/db.ts]) đọc tenantId từ AsyncLocalStorage (`getTenantId()`) tại thời điểm query THỰC THI. PrismaPromise thực thi lười (khi `await`/`.then`).

**Hệ quả:** mọi truy vấn `db.*` PHẢI được `await` BÊN TRONG callback của `runWithTenant(tenantId, async () => { ... await db.x() ... })`. Nếu trả promise lười ra ngoài rồi await bên ngoài context → extension đọc context quá muộn → ném lỗi "không có tenant context" (fail-closed) hoặc mất cô lập.

**Why:** AsyncLocalStorage chỉ giữ context cho async continuations khởi tạo bên trong `run()`. Await ngoài scope = mất context.

**How to apply:** Route handler / server component bọc TOÀN BỘ logic trong `runWithTenant(tenant.id, async () => { ...toàn bộ await db ở đây... })`. Không viết `const p = runWithTenant(id, () => db.x()); await p`. Test dùng helper `runAs(tenantId, () => db.x())` (await bên trong). Control Plane dùng `dbAdmin` (không cô lập, không cần context).

**BẪY THỨ HAI (e2e bắt được, unit test KHÔNG):** `AsyncLocalStorage` PHẢI được cache trên `globalThis` trong [src/lib/tenant-context.ts]. Next.js nạp module server ở nhiều bundle khác nhau → nếu mỗi lần `new AsyncLocalStorage()` thì `run()` (ở page) và `getStore()` (trong Prisma extension db.ts) đọc/ghi 2 instance KHÁC NHAU → mọi trang public/admin 500 "không có tenant context". Unit test pass (1 module instance) nhưng app thật chết. Fix: `const tenantStorage = (globalThis.__tenantStorage ??= new AsyncLocalStorage())` — giống cách db.ts cache Prisma client. Đây là lý do phải có e2e chạy trên `next dev` thật.
