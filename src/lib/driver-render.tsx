/**
 * Helper render trang cổng tài xế: guard session DRIVER, dựng tenant context, lấy hồ
 * sơ Driver, bọc DriverShell. Nếu chưa có hồ sơ Driver -> hiển thị thông báo.
 */
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Driver } from '@prisma/client';
import { dbAdmin, db } from './db';
import { runWithTenant } from './tenant-context';
import { getDriverSession, type DriverSession } from './driver-auth';
import DriverShell from '@/components/driver/DriverShell';

type DriverCtx = {
  session: DriverSession;
  driver: Driver;
  tenant: { id: string; brandName: string; slug: string };
};

export async function renderDriver(build: (ctx: DriverCtx) => Promise<ReactNode>): Promise<ReactNode> {
  const session = await getDriverSession();
  if (!session) redirect('/tai-xe/dang-nhap');

  const tenant = await dbAdmin.tenant.findUnique({
    where: { id: session!.tenantId },
    select: { id: true, brandName: true, slug: true },
  });
  if (!tenant) redirect('/tai-xe/dang-nhap');

  const { driver, content } = await runWithTenant(session!.tenantId, async () => {
    const d = await db.driver.findFirst({ where: { userId: session!.userId } });
    if (!d) {
      return {
        driver: null,
        content: (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Chưa có hồ sơ tài xế</h2>
            <p className="mt-1 text-sm text-slate-500">Tài khoản chưa được gắn với hồ sơ tài xế. Vui lòng liên hệ chủ xe.</p>
          </div>
        ) as ReactNode,
      };
    }
    return { driver: d, content: await build({ session: session!, driver: d, tenant: tenant! }) };
  });

  return (
    <DriverShell tenant={tenant!} driverName={driver?.fullName ?? 'Tài xế'}>
      {content}
    </DriverShell>
  );
}
