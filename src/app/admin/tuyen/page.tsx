/**
 * CRUD tuyến (CLAUDE.md Mục 12.B). Tạo mới áp giới hạn gói (assertWithinLimit ở server).
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { getPlan } from '@/lib/entitlement';
import { AdminInput as In, DeleteButton, Card, FlashError } from '@/components/admin/ui';
import { upsertRouteAction, deleteRouteAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function RoutesPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderAdmin(async ({ session }) => {
    const [routes, plan] = await Promise.all([
      db.route.findMany({ orderBy: { fromName: 'asc' } }),
      getPlan(session.tenantId),
    ]);
    const limitLabel = plan.maxRoutes < 0 ? 'không giới hạn' : `${routes.length}/${plan.maxRoutes}`;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Tuyến</h1>
          <span className="text-sm text-slate-500">Đã dùng: {limitLabel}</span>
        </div>

        <FlashError message={searchParams.error} />

        <Card title="Thêm tuyến">
          <form action={upsertRouteAction} className="grid items-end gap-3 md:grid-cols-5">
            <In name="fromName" label="Điểm đi" required />
            <In name="toName" label="Điểm đến" required />
            <In name="priceFrom" label="Giá từ (₫)" type="number" required />
            <In name="icon" label="Icon (emoji)" />
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Thêm</button>
          </form>
        </Card>

        <section className="space-y-3">
          {routes.map((r) => (
            <div key={r.id} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <form action={upsertRouteAction} className="grid flex-1 items-end gap-3 md:grid-cols-5">
                <input type="hidden" name="id" value={r.id} />
                <In name="fromName" label="Điểm đi" defaultValue={r.fromName} />
                <In name="toName" label="Điểm đến" defaultValue={r.toName} />
                <In name="priceFrom" label="Giá từ" type="number" defaultValue={String(r.priceFrom)} />
                <In name="icon" label="Icon" defaultValue={r.icon ?? ''} />
                <button className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">Lưu</button>
              </form>
              <DeleteButton action={deleteRouteAction} id={r.id} />
            </div>
          ))}
          {routes.length === 0 && <p className="text-center text-slate-400">Chưa có tuyến nào.</p>}
        </section>
      </div>
    );
  });
}
