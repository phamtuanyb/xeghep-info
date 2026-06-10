/**
 * Xuất CSV báo cáo cho Tenant Admin (CLAUDE.md Mục 12.B). BOM UTF-8 để Excel hiển thị
 * đúng tiếng Việt có dấu. Chạy trong tenant context của admin.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { runWithTenant } from '@/lib/tenant-context';
import { getAdminSession } from '@/lib/admin-auth';

function cell(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function csvResponse(header: string[], rows: string[][], filename: string): NextResponse {
  const lines = [header.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))];
  const csv = '﻿' + lines.join('\r\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 });

  const type = req.nextUrl.searchParams.get('type') === 'route' ? 'route' : 'driver';

  return runWithTenant(session.tenantId, async () => {
    if (type === 'driver') {
      const [grouped, drivers] = await Promise.all([
        db.transaction.groupBy({ by: ['driverId'], _sum: { amount: true, commission: true }, _count: { _all: true } }),
        db.driver.findMany({ select: { id: true, fullName: true } }),
      ]);
      const name = new Map(drivers.map((d) => [d.id, d.fullName]));
      const rows = grouped.map((g) => [
        g.driverId ? name.get(g.driverId) ?? '—' : 'Không gán',
        String(g._count._all),
        String(g._sum.amount ?? 0),
        String(g._sum.commission ?? 0),
      ]);
      return csvResponse(['Tài xế', 'Số giao dịch', 'Doanh thu', 'Hoa hồng'], rows, 'bao-cao-tai-xe.csv');
    }

    const trips = await db.trip.findMany({ include: { route: true } });
    const agg = new Map<string, { name: string; trips: number; seats: number; revenue: number }>();
    for (const t of trips) {
      const cur = agg.get(t.routeId) ?? { name: `${t.route.fromName} → ${t.route.toName}`, trips: 0, seats: 0, revenue: 0 };
      const booked = Math.max(0, t.seatsTotal - t.seatsLeft);
      cur.trips += 1;
      cur.seats += booked;
      cur.revenue += booked * t.pricePerSeat;
      agg.set(t.routeId, cur);
    }
    const rows = [...agg.values()].map((r) => [r.name, String(r.trips), String(r.seats), String(r.revenue)]);
    return csvResponse(['Tuyến', 'Số chuyến', 'Ghế đã đặt', 'Doanh thu ước tính'], rows, 'bao-cao-tuyen.csv');
  });
}
