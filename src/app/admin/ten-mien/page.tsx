/**
 * Tự cấu hình tên miền riêng cho gói Pro (CLAUDE.md Mục 14 PHA 2). Chỉ Quản trị.
 * Hiển thị hướng dẫn DNS + trạng thái xác thực; gating ở server.
 */
import { dbAdmin } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { can } from '@/lib/entitlement';
import { Card, FlashError, FlashOk } from '@/components/admin/ui';
import { setCustomDomainAction, verifyCustomDomainAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function CustomDomainPage({ searchParams }: { searchParams: { error?: string; verified?: string } }) {
  return renderAdmin(async ({ session }) => {
    const [tenant, allowed, rootDomain, serverIp] = await Promise.all([
      dbAdmin.tenant.findUnique({ where: { id: session.tenantId } }),
      can(session.tenantId, 'customDomain'),
      Promise.resolve(process.env.ROOT_DOMAIN ?? 'xeghep.info'),
      Promise.resolve(process.env.PLATFORM_SERVER_IP || '(IP máy chủ — liên hệ MKT)'),
    ]);
    if (!tenant) return <p>Không tìm thấy tenant.</p>;

    if (!allowed) {
      return (
        <div className="space-y-4">
          <h1 className="font-heading text-2xl font-bold">Tên miền riêng</h1>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Tên miền riêng chỉ có ở gói <strong>Pro</strong>.</p>
            <p className="mt-1 text-sm text-slate-400">
              Gói Free dùng địa chỉ <strong>{tenant.slug}.{rootDomain}</strong>. Liên hệ MKT để nâng cấp.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Tên miền riêng</h1>
        <FlashError message={searchParams.error} />
        <FlashOk message={searchParams.verified ? 'Đã xác thực tên miền thành công!' : undefined} />

        <Card title="Tên miền của bạn">
          <form action={setCustomDomainAction} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-600">Nhập tên miền (để trống để gỡ bỏ)</label>
              <input name="customDomain" defaultValue={tenant.customDomain ?? ''} placeholder="nhaxecuaban.vn" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu tên miền</button>
          </form>

          {tenant.customDomain && (
            <div className="mt-4 flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${tenant.customDomainVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {tenant.customDomainVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}
              </span>
              {!tenant.customDomainVerified && (
                <form action={verifyCustomDomainAction}>
                  <button className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50">Xác thực ngay</button>
                </form>
              )}
            </div>
          )}
        </Card>

        <Card title="Hướng dẫn cấu hình DNS">
          <p className="text-sm text-slate-600">
            Tại nhà cung cấp tên miền, thêm <strong>2 bản ghi</strong> sau rồi bấm “Xác thực ngay”:
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-700">
            <div className="mb-2">
              <div className="text-slate-400"># Tên miền gốc (apex)</div>
              <div>Tên (Host): <strong>@</strong></div>
              <div>Loại: <strong>A</strong></div>
              <div>Trỏ tới (Value): <strong>{serverIp}</strong></div>
              <div>TTL: 3600</div>
            </div>
            <div>
              <div className="text-slate-400"># Bản ghi www</div>
              <div>Tên (Host): <strong>www</strong></div>
              <div>Loại: <strong>CNAME</strong></div>
              <div>Trỏ tới (Value): <strong>{rootDomain}</strong></div>
              <div>TTL: 3600</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Lưu ý: tên miền gốc (apex) phải dùng bản ghi <strong>A</strong> trỏ về IP máy chủ — phần lớn nhà cung cấp
            không cho dùng CNAME ở apex. DNS có thể mất vài phút đến vài giờ để cập nhật; chứng chỉ HTTPS được cấp tự
            động sau khi trỏ đúng. Vào <strong>www</strong> hay tên miền gốc đều hiển thị website của bạn (gói Pro có
            thể ẩn footer “Powered by MKT”).
          </p>
        </Card>
      </div>
    );
  }, { adminOnly: true });
}
