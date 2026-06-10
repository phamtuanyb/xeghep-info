/**
 * Tự cấu hình tên miền riêng cho gói Pro (CLAUDE.md Mục 10/12.B PHA 2).
 * Logic thuần (dễ test) — gating ở SERVER qua entitlement, lưu qua dbAdmin.
 */
import { createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { dbAdmin } from './db';
import { can } from './entitlement';

// Tên miền hợp lệ: nhiều nhãn, mỗi nhãn a-z0-9 và gạch ngang (không ở đầu/cuối).
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export type DomainResult = { ok: true } | { ok: false; error: string };

/**
 * Token xác thực tên miền: HMAC của tenantId bằng JWT_SECRET. Dùng để /api/health
 * trả về (thay vì lộ tenantId thô) và verifyCustomDomain so khớp — chống dò tenant.
 */
export function domainVerifyToken(tenantId: string): string {
  const secret = process.env.JWT_SECRET ?? '';
  return createHmac('sha256', secret).update(`domain:${tenantId}`).digest('hex');
}

/** IPv4 thuộc dải nội bộ/loopback/link-local/CGNAT -> chặn (chống SSRF). */
function isPrivateIpv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p as [number, number, number, number];
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIp(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return isPrivateIpv4(ip);
  if (fam === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIpv4(mapped[1]!);
    return false;
  }
  return true; // không phải IP hợp lệ -> coi như nguy hiểm
}

/**
 * Host có an toàn để fetch không (chống SSRF): không phải localhost/IP literal/tên nội bộ,
 * và MỌI địa chỉ DNS phân giải ra đều là IP công khai.
 */
async function isHostSafeToFetch(hostname: string): Promise<boolean> {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (isIP(h) !== 0) return false; // không cho IP literal
  try {
    const addrs = await lookup(h, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/** Đặt/đổi/xóa tên miền riêng. Đổi domain -> đặt lại trạng thái chưa xác thực. */
export async function setCustomDomain(tenantId: string, domainRaw: string): Promise<DomainResult> {
  // Chuẩn hóa: lowercase, bỏ dấu chấm cuối VÀ bỏ tiền tố "www." -> lưu dạng apex.
  // Resolver khớp cả apex lẫn www nên người dùng vào www.<domain> vẫn đúng tenant.
  const domain = domainRaw.trim().toLowerCase().replace(/\.$/, '').replace(/^www\./, '');

  // Xóa tên miền: ai cũng làm được (gỡ bỏ).
  if (!domain) {
    await dbAdmin.tenant.update({ where: { id: tenantId }, data: { customDomain: null, customDomainVerified: false } });
    return { ok: true };
  }

  if (!(await can(tenantId, 'customDomain'))) {
    return { ok: false, error: 'Tên miền riêng chỉ có ở gói Pro. Vui lòng nâng cấp.' };
  }
  if (domain.length > 253 || !DOMAIN_RE.test(domain) || isIP(domain) !== 0) {
    return { ok: false, error: 'Tên miền không hợp lệ. Ví dụ: nhaxecuaban.vn' };
  }
  const taken = await dbAdmin.tenant.findFirst({ where: { customDomain: domain, id: { not: tenantId } } });
  if (taken) return { ok: false, error: 'Tên miền đã được dùng bởi website khác.' };

  await dbAdmin.tenant.update({
    where: { id: tenantId },
    data: { customDomain: domain, customDomainVerified: false },
  });
  return { ok: true };
}

/**
 * Xác thực tên miền đã trỏ đúng về nền tảng chưa: gọi `https://<domain>/api/health`
 * và so khớp TOKEN (HMAC tenantId) trả về. Thành công -> đánh dấu đã xác thực.
 *
 * Chống SSRF: chặn host nội bộ/IP literal/IP private (isHostSafeToFetch) và KHÔNG
 * đi theo redirect (redirect: 'error') để tránh bị chuyển hướng vào mạng nội bộ.
 */
export async function verifyCustomDomain(tenantId: string): Promise<DomainResult> {
  const tenant = await dbAdmin.tenant.findUnique({ where: { id: tenantId }, select: { customDomain: true } });
  if (!tenant?.customDomain) return { ok: false, error: 'Chưa có tên miền để xác thực.' };

  if (!(await isHostSafeToFetch(tenant.customDomain))) {
    return { ok: false, error: 'Tên miền không hợp lệ hoặc chưa trỏ về máy chủ công khai.' };
  }

  try {
    const res = await fetch(`https://${tenant.customDomain}/api/health`, {
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
    const data = (await res.json()) as { token?: string | null };
    if (data?.token && data.token === domainVerifyToken(tenantId)) {
      await dbAdmin.tenant.update({ where: { id: tenantId }, data: { customDomainVerified: true } });
      return { ok: true };
    }
    return { ok: false, error: 'Tên miền chưa trỏ về website của bạn. Kiểm tra lại bản ghi DNS.' };
  } catch {
    return { ok: false, error: 'Chưa kết nối được tới tên miền. Cấu hình DNS rồi thử lại sau ít phút.' };
  }
}
