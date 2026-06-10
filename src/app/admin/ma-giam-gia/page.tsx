/**
 * Mã giảm giá (CLAUDE.md Mục 12.B) — tính năng PRO. Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { can } from '@/lib/entitlement';
import { Card, DeleteButton, FlashError } from '@/components/admin/ui';
import { upsertCouponAction, deleteCouponAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function CouponsPage({ searchParams }: { searchParams: { error?: string } }) {
  return renderAdmin(async ({ session }) => {
    const couponsEnabled = await can(session.tenantId, 'coupons');

    if (!couponsEnabled) {
      return (
        <div className="space-y-4">
          <h1 className="font-heading text-2xl font-bold">Mã giảm giá</h1>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Tính năng <strong>Mã giảm giá</strong> chỉ có ở gói <strong>Pro</strong>.</p>
            <p className="mt-1 text-sm text-slate-400">Liên hệ MKT để nâng cấp gói.</p>
          </div>
        </div>
      );
    }

    const coupons = await db.coupon.findMany({ orderBy: { code: 'asc' } });

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Mã giảm giá</h1>
        <FlashError message={searchParams.error} />

        <Card title="Tạo mã">
          <CouponForm action={upsertCouponAction} />
        </Card>

        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <CouponForm action={upsertCouponAction} coupon={c} />
              <DeleteButton action={deleteCouponAction} id={c.id} />
            </div>
          ))}
          {coupons.length === 0 && <p className="text-center text-slate-400">Chưa có mã nào.</p>}
        </div>
      </div>
    );
  }, { adminOnly: true });
}

type CouponShape = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  expiresAt: Date | null;
  isActive: boolean;
};

function CouponForm({ action, coupon }: { action: (fd: FormData) => Promise<void>; coupon?: CouponShape }) {
  const dateVal = coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '';
  return (
    <form action={action} className="grid flex-1 items-end gap-3 md:grid-cols-4">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <F label="Mã"><input name="code" defaultValue={coupon?.code} required placeholder="GIAM10" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase" /></F>
      <F label="Loại">
        <select name="type" defaultValue={coupon?.type ?? 'percent'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="percent">Phần trăm (%)</option>
          <option value="fixed">Cố định (₫)</option>
        </select>
      </F>
      <F label="Giá trị"><input type="number" name="value" defaultValue={coupon?.value ?? 0} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></F>
      <F label="Đơn tối thiểu"><input type="number" name="minOrder" defaultValue={coupon?.minOrder ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></F>
      <F label="Giảm tối đa"><input type="number" name="maxDiscount" defaultValue={coupon?.maxDiscount ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></F>
      <F label="Giới hạn lượt"><input type="number" name="usageLimit" defaultValue={coupon?.usageLimit ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></F>
      <F label="Hết hạn"><input type="date" name="expiresAt" defaultValue={dateVal} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></F>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="h-4 w-4" /> Bật</label>
        <button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">{coupon ? 'Lưu' : 'Tạo'}</button>
      </div>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}
