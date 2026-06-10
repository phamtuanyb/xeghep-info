---
name: create-needs-explicit-tenantid
description: db.*.create needs explicit tenantId to satisfy TS; the isolation extension still overrides it
metadata:
  type: project
---

Trong dự án Xe Ghép, client cô lập `db` ([src/lib/db.ts]) tự chèn `tenantId` lúc runtime, NHƯNG kiểu Prisma của `create`/`createMany` vẫn YÊU CẦU `tenantId` (hoặc `tenant`) ở compile-time → `tsc` báo lỗi nếu thiếu.

**How to apply:** Khi gọi `db.<model>.create({ data: {...} })` trong tenant context, truyền `tenantId: tenant.id` (hoặc `getTenantIdOrThrow()`) tường minh trong `data`. An toàn vì extension spread `tenantId` SAU CÙNG nên vẫn ghi đè về tenant hiện tại — không thể tạo nhầm sang tenant khác (đã có test `tenant-isolation` chứng minh create bỏ qua tenantId giả mạo).

Reads/update/delete/where KHÔNG cần truyền tenantId (extension lo). Chỉ create/createMany cần, và chỉ để thỏa mãn TypeScript. Liên quan: [[runwithtenant-await-inside]].
