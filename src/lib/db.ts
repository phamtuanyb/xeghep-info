/**
 * Prisma Client + Tenant Isolation Extension (CLAUDE.md Mục 8 — PHẦN QUAN TRỌNG NHẤT).
 *
 * `db`      — client ĐÃ cô lập tenant. Mọi thao tác trên model có cột tenantId sẽ:
 *               - đọc/sửa/xóa: tự chèn `where.tenantId = <tenant hiện tại>`
 *               - tạo mới:     tự đặt `data.tenantId = <tenant hiện tại>` (ghi đè mọi giá trị giả mạo)
 *             Nếu chạy NGOÀI tenant context trên các model này -> NÉM LỖI (fail-closed).
 *
 * `dbAdmin` — client KHÔNG áp extension. CHỈ dùng trong Control Plane sau khi đã
 *             check SUPER_ADMIN, hoặc cho tác vụ hệ thống (seed/migrate/test setup).
 *
 * Lưu ý: dựa trên tính năng `extendedWhereUnique` (GA từ Prisma 5) để chèn tenantId
 * vào where của findUnique/update/delete bên cạnh khóa duy nhất.
 */
import { PrismaClient } from '@prisma/client';
import { getTenantId } from './tenant-context';

/**
 * Danh sách model có cột `tenantId` (lớp nghiệp vụ — CLAUDE.md Mục 6).
 * Các model lớp SaaS (Tenant, Plan, Subscription, Theme, PlatformUser, ...) KHÔNG
 * nằm ở đây nên không bị lọc tenant.
 */
const TENANT_MODELS = new Set<string>([
  'User',
  'Driver',
  'Route',
  'Trip',
  'Booking',
  'Transaction',
  'Coupon',
  'Article',
  'Review',
  'Complaint',
  'HomeContent',
  'TenantSetting',
  'AuditLog',
]);

/** Thao tác có mệnh đề `where` cần chèn tenantId. */
const WHERE_OPERATIONS = new Set<string>([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
]);

/** Thao tác tạo nhiều bản ghi. */
const CREATE_MANY_OPERATIONS = new Set<string>(['createMany', 'createManyAndReturn']);

function createTenantScopedClient() {
  return new PrismaClient().$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Model không có tenantId -> không can thiệp.
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }

          // Fail-closed: cấm thao tác model nghiệp vụ khi không có tenant context.
          const tenantId = getTenantId();
          if (!tenantId) {
            throw new Error(
              `Cô lập tenant: thao tác "${operation}" trên model "${model}" bị chặn vì ` +
                `không có tenant context. Dùng runWithTenant() hoặc dbAdmin (Control Plane).`
            );
          }

          // args có thể undefined (vd count()).
          const next: Record<string, unknown> = { ...(args as Record<string, unknown> | undefined) };

          if (operation === 'create') {
            next.data = { ...(next.data as Record<string, unknown> | undefined), tenantId };
          } else if (CREATE_MANY_OPERATIONS.has(operation)) {
            const data = next.data;
            next.data = Array.isArray(data)
              ? data.map((row) => ({ ...(row as Record<string, unknown>), tenantId }))
              : { ...(data as Record<string, unknown> | undefined), tenantId };
          } else if (operation === 'upsert') {
            next.where = { ...(next.where as Record<string, unknown> | undefined), tenantId };
            next.create = { ...(next.create as Record<string, unknown> | undefined), tenantId };
            // `update` của upsert đã nằm trong phạm vi tenant nhờ where ở trên.
          } else if (WHERE_OPERATIONS.has(operation)) {
            next.where = { ...(next.where as Record<string, unknown> | undefined), tenantId };
          }

          return query(next);
        },
      },
    },
  });
}

type TenantScopedClient = ReturnType<typeof createTenantScopedClient>;

const globalForPrisma = globalThis as unknown as {
  __db?: TenantScopedClient;
  __dbAdmin?: PrismaClient;
};

/** Client cô lập tenant — dùng cho TẤT CẢ truy vấn nghiệp vụ. */
export const db: TenantScopedClient = globalForPrisma.__db ?? createTenantScopedClient();

/** Client KHÔNG cô lập — chỉ Control Plane / tác vụ hệ thống (CLAUDE.md Mục 8). */
export const dbAdmin: PrismaClient = globalForPrisma.__dbAdmin ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__db = db;
  globalForPrisma.__dbAdmin = dbAdmin;
}
