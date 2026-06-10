/**
 * Cổng kiểm soát cấp chứng chỉ TLS on-demand (Caddy gọi trước khi xin Let's Encrypt).
 *
 * Caddy `on_demand_tls { ask <url> }` gọi GET ?domain=<host>. Trả 2xx = CHO PHÉP cấp
 * cert cho host đó; khác 2xx = TỪ CHỐI. Mục đích: chỉ cấp cert cho host hợp lệ
 * (tên miền nền tảng, subdomain tenant đang tồn tại, hoặc tên miền riêng đã được tenant
 * Pro lưu) — chặn kẻ xấu trỏ domain rác về VPS để ép xin hàng loạt cert (rate-limit / DoS).
 *
 * Chạy tầng Node + dbAdmin (tra bảng Tenant — lớp nền tảng, trước khi có tenant context).
 */
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

function deny(): NextResponse {
  return new NextResponse('not allowed', { status: 404 });
}
function allow(): NextResponse {
  return new NextResponse('ok', { status: 200 });
}

export async function GET(req: Request): Promise<NextResponse> {
  const domain = (new URL(req.url).searchParams.get('domain') ?? '')
    .split(':')[0]!
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  if (!domain) return new NextResponse('no domain', { status: 400 });

  const rootDomain = (process.env.ROOT_DOMAIN ?? '').toLowerCase();

  // 1) Tên miền nền tảng + subdomain hệ thống.
  if (domain === rootDomain || domain === `www.${rootDomain}` || domain === `control.${rootDomain}`) {
    return allow();
  }

  // 2) Subdomain tenant: <slug>.<ROOT_DOMAIN> — chỉ cấp cert nếu tenant tồn tại.
  if (rootDomain && domain.endsWith(`.${rootDomain}`)) {
    const slug = domain.slice(0, domain.length - rootDomain.length - 1);
    if (!slug || slug === 'www') return deny();
    const t = await dbAdmin.tenant.findUnique({ where: { slug }, select: { id: true } });
    return t ? allow() : deny();
  }

  // 3) Tên miền riêng (apex hoặc www) — phải đã được một tenant Pro lưu.
  const apex = domain.replace(/^www\./, '');
  const t = await dbAdmin.tenant.findFirst({
    where: { OR: [{ customDomain: domain }, { customDomain: apex }] },
    select: { id: true },
  });
  return t ? allow() : deny();
}
