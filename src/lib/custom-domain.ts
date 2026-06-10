/**
 * Tự cấu hình tên miền riêng cho gói Pro (CLAUDE.md Mục 10/12.B PHA 2).
 * Logic thuần (dễ test) — gating ở SERVER qua entitlement, lưu qua dbAdmin.
 */
import { dbAdmin } from './db';
import { can } from './entitlement';

// Tên miền hợp lệ: nhiều nhãn, mỗi nhãn a-z0-9 và gạch ngang (không ở đầu/cuối).
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export type DomainResult = { ok: true } | { ok: false; error: string };

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
  if (domain.length > 253 || !DOMAIN_RE.test(domain)) {
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
 * và so khớp tenantId trả về. Thành công -> đánh dấu đã xác thực.
 */
export async function verifyCustomDomain(tenantId: string): Promise<DomainResult> {
  const tenant = await dbAdmin.tenant.findUnique({ where: { id: tenantId }, select: { customDomain: true } });
  if (!tenant?.customDomain) return { ok: false, error: 'Chưa có tên miền để xác thực.' };

  try {
    const res = await fetch(`https://${tenant.customDomain}/api/health`, { signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as { tenantId?: string | null };
    if (data?.tenantId === tenantId) {
      await dbAdmin.tenant.update({ where: { id: tenantId }, data: { customDomainVerified: true } });
      return { ok: true };
    }
    return { ok: false, error: 'Tên miền chưa trỏ về website của bạn. Kiểm tra lại bản ghi DNS.' };
  } catch {
    return { ok: false, error: 'Chưa kết nối được tới tên miền. Cấu hình DNS rồi thử lại sau ít phút.' };
  }
}
