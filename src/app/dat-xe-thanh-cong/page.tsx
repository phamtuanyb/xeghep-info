/**
 * Trang thông báo đặt xe thành công (lead) — CLAUDE.md Mục 12.A.
 *
 * QUAN TRỌNG: trang này KHÔNG được phép 404. Khi tới qua redirect của server action
 * (điều hướng mềm RSC), việc giải tenant theo host có thể thất bại; nếu dùng
 * getPublicTenant (gọi notFound) thì production sẽ trả 404. Vì vậy ở đây ta giải tenant
 * AN TOÀN (không notFound) — có thì lấy thương hiệu/hotline, không có thì hiển thị chung.
 * Trang tự chứa (không cần Shell theme) nên luôn render được sau khi đặt xe.
 */
import Link from 'next/link';
import { headers } from 'next/headers';
import { resolveTenantByHost } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

export default async function BookingLeadSuccessPage() {
  const h = headers();
  const host = h.get('x-tenant-host') ?? h.get('host') ?? '';
  const slug = h.get('x-tenant-slug');
  const res = await resolveTenantByHost(host, slug);
  const tenant = res.ok ? res.tenant : null;
  const brand = tenant?.primaryColor || '#1565C0';

  return (
    <div
      style={{ ['--brand' as string]: brand }}
      className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
          ✅
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Đã đặt chuyến thành công!</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Tổng đài sẽ liên hệ với bạn để tư vấn cụ thể về lịch trình chuyến đi.
        </p>

        {tenant?.hotline && (
          <p className="mt-4 text-sm text-slate-500">
            Cần gấp? Gọi ngay{' '}
            <a href={`tel:${tenant.hotline}`} className="font-semibold text-[color:var(--brand)]">
              {tenant.hotline}
            </a>
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Về trang chủ
          </Link>
          <Link
            href="/tim-chuyen"
            className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Tìm chuyến khác
          </Link>
        </div>
      </div>

      {tenant?.brandName && <p className="mt-6 text-xs text-slate-400">{tenant.brandName}</p>}
    </div>
  );
}
