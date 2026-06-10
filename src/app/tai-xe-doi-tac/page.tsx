/**
 * Đội ngũ tài xế đối tác (CLAUDE.md Mục 12.A) — danh sách tài xế đã xác thực.
 */
import type { Metadata } from 'next';
import { renderInThemeShell } from '@/lib/public-tenant';
import { getApprovedDrivers } from '@/lib/public-cache';
import { buildTenantMetadata } from '@/lib/seo';
import { DriverCard, SectionHeading } from '@/themes/shared';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata({ path: '/tai-xe-doi-tac', pageTitle: 'Đội ngũ tài xế', pageDescription: 'Đội ngũ tài xế đã được xác thực hồ sơ — an toàn, đúng giờ.' });
}

export default async function DriversPage() {
  return renderInThemeShell(async ({ tenant }) => {
    const drivers = await getApprovedDrivers(tenant.id);

    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading title="Đội ngũ tài xế" subtitle="Tài xế đã được xác thực hồ sơ" />
        {drivers.length === 0 ? (
          <p className="text-center text-slate-400">Chưa có tài xế nào.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {drivers.map((d) => (
              <DriverCard key={d.id} driver={d} />
            ))}
          </div>
        )}
      </div>
    );
  });
}
