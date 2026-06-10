/**
 * Trang chủ public (CLAUDE.md Mục 12.A) — render theo theme của tenant.
 * Dữ liệu lấy qua Data Cache theo tenant (PHA 2 tối ưu tải cao) — xem public-cache.ts.
 */
import type { Metadata } from 'next';
import { getPublicTenant } from '@/lib/public-tenant';
import { getHomeBundle } from '@/lib/public-cache';
import { getTheme } from '@/themes';
import { buildTenantMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata({ path: '/' });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string };
}) {
  const tenant = await getPublicTenant();
  const bundle = await getHomeBundle(tenant.id);

  const theme = getTheme(bundle.themeKey);
  const Shell = theme.Shell;
  const Home = theme.Home;

  return (
    <Shell tenant={tenant} showPoweredBy={bundle.showPoweredBy}>
      {/* Phản hồi sau khi đặt chuyến từ form hero (createLeadAction -> /?sent=1) */}
      {searchParams.sent === '1' && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
            ✅ Đã gửi yêu cầu đặt chuyến. Tổng đài sẽ liên hệ với bạn sớm nhất.
          </p>
        </div>
      )}
      {searchParams.error && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-200">
            {searchParams.error}
          </p>
        </div>
      )}
      <Home tenant={tenant} content={bundle.content} routes={bundle.routes} drivers={bundle.drivers} />
    </Shell>
  );
}
