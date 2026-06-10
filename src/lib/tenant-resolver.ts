/**
 * Tra Tenant theo host/slug và áp dụng quy tắc trạng thái (CLAUDE.md Mục 7).
 * Chạy ở tầng Node (Prisma được). Dùng `dbAdmin` vì việc tra Tenant là thao tác
 * lớp nền tảng (bảng Tenant không có tenantId) và diễn ra TRƯỚC khi có tenant context.
 *
 * Kết quả dạng discriminated union để layout/route handler quyết định render:
 *  - ok: true                      -> có tenant ACTIVE, kèm dữ liệu tenant
 *  - reason: 'not-found'           -> 404
 *  - reason: 'pending'             -> trang "site chưa kích hoạt"
 *  - reason: 'locked'              -> trang "site tạm khóa"
 */
import { dbAdmin } from './db';

export type ResolvedTenant = {
  id: string;
  slug: string;
  brandName: string;
  themeId: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  hotline: string | null;
  customDomain: string | null;
};

export type TenantResolution =
  | { ok: true; tenant: ResolvedTenant }
  | { ok: false; reason: 'not-found' | 'pending' | 'locked' };

const TENANT_SELECT = {
  id: true,
  slug: true,
  brandName: true,
  status: true,
  themeId: true,
  primaryColor: true,
  logoUrl: true,
  hotline: true,
  customDomain: true,
} as const;

/**
 * Tra tenant từ host (và slug đã bóc tách sẵn ở middleware nếu có).
 * @param host  host đã bỏ port, lowercase (header x-tenant-host)
 * @param slug  slug subdomain nếu có (header x-tenant-slug)
 */
export async function resolveTenantByHost(
  host: string,
  slug?: string | null
): Promise<TenantResolution> {
  const cleanHost = host.split(':')[0]!.toLowerCase();
  const rootDomain = (process.env.ROOT_DOMAIN ?? '').toLowerCase();

  // Xác định slug: ưu tiên slug truyền vào; nếu không, thử bóc từ host theo ROOT_DOMAIN.
  let resolvedSlug = slug ?? null;
  if (!resolvedSlug && rootDomain && cleanHost.endsWith(`.${rootDomain}`)) {
    const candidate = cleanHost.slice(0, cleanHost.length - rootDomain.length - 1);
    if (candidate && candidate !== 'www') resolvedSlug = candidate;
  }

  // Tên miền riêng: khớp cả apex lẫn www (customDomain lưu dạng apex). Vào www.<domain>
  // vẫn ra đúng tenant.
  const apexHost = cleanHost.replace(/^www\./, '');
  const tenant = resolvedSlug
    ? await dbAdmin.tenant.findUnique({ where: { slug: resolvedSlug }, select: TENANT_SELECT })
    : await dbAdmin.tenant.findFirst({
        where: { OR: [{ customDomain: cleanHost }, { customDomain: apexHost }] },
        select: TENANT_SELECT,
      });

  if (!tenant) {
    return { ok: false, reason: 'not-found' };
  }
  if (tenant.status === 'PENDING') {
    return { ok: false, reason: 'pending' };
  }
  if (tenant.status === 'LOCKED') {
    return { ok: false, reason: 'locked' };
  }

  const { status: _status, ...rest } = tenant;
  void _status;
  return { ok: true, tenant: rest };
}
