/**
 * Tenant resolution theo host (CLAUDE.md Mục 7).
 *
 * Middleware chạy ở Edge runtime — KHÔNG thể gọi Prisma trực tiếp. Vì vậy ở đây ta:
 *  - Phân loại lớp ứng dụng theo host (Control Plane vs tenant).
 *  - Bóc tách subdomain slug / host và gắn vào header nội bộ (x-tenant-slug, x-tenant-host).
 * Việc tra DB (tìm Tenant theo slug/customDomain) + xử lý PENDING/LOCKED/404 thực hiện ở
 * tầng Node qua `resolveTenantByHost()` (src/lib/tenant-resolver.ts), được gọi từ layout/
 * route handler — nơi Prisma chạy được.
 *
 * Header nội bộ (do middleware đặt, client KHÔNG thể giả mạo vì middleware luôn ghi đè):
 *  - x-app-layer:   'control' | 'tenant'
 *  - x-tenant-host: host (đã bỏ port, lowercase) — dùng để tra customDomain
 *  - x-tenant-slug: slug subdomain (nếu host khớp <slug>.<ROOT_DOMAIN>)
 */
import { NextResponse, type NextRequest } from 'next/server';

function stripInternalHeaders(headers: Headers): void {
  // Chống giả mạo: xóa mọi header nội bộ đến từ client trước khi tự đặt lại.
  headers.delete('x-app-layer');
  headers.delete('x-tenant-host');
  headers.delete('x-tenant-slug');
  headers.delete('x-tenant-id');
}

export function middleware(req: NextRequest): NextResponse {
  const rawHost = req.headers.get('host') ?? '';
  const host = rawHost.split(':')[0]!.toLowerCase();
  const rootDomain = (process.env.ROOT_DOMAIN ?? '').toLowerCase();

  const requestHeaders = new Headers(req.headers);
  stripInternalHeaders(requestHeaders);

  // Control Plane: control.<ROOT_DOMAIN> -> bỏ qua tenant context.
  if (rootDomain && host === `control.${rootDomain}`) {
    requestHeaders.set('x-app-layer', 'control');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Lớp tenant.
  requestHeaders.set('x-app-layer', 'tenant');
  requestHeaders.set('x-tenant-host', host);

  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const slug = host.slice(0, host.length - rootDomain.length - 1);
    // Bỏ qua các subdomain hệ thống (www). 'control' đã xử lý ở trên.
    if (slug && slug !== 'www') {
      requestHeaders.set('x-tenant-slug', slug);
    }
  } else if (host.endsWith('.localhost')) {
    // Tiện cho phát triển: <slug>.localhost:3000 -> tenant theo slug.
    const slug = host.slice(0, host.length - '.localhost'.length);
    if (slug && slug !== 'www' && slug !== 'control') {
      requestHeaders.set('x-tenant-slug', slug);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Bỏ qua asset tĩnh & tối ưu ảnh. robots.txt/sitemap.xml VẪN qua middleware để
  // nhận x-tenant-slug/x-tenant-host (sinh nội dung theo tenant — Mục 13).
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
