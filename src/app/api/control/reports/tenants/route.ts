/**
 * Xuất CSV danh sách người thuê (CLAUDE.md Mục 12.D). Chỉ SUPER_ADMIN.
 * Thêm BOM UTF-8 để Excel mở đúng tiếng Việt có dấu.
 */
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { getControlSession } from '@/lib/control-auth';

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  // Bọc trong dấu nháy kép, escape nháy kép bên trong.
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<NextResponse> {
  const session = await getControlSession();
  if (!session) {
    return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
  }

  const tenants = await dbAdmin.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subscription: { include: { plan: true } } },
  });

  const header = [
    'Thương hiệu',
    'Subdomain',
    'Tên miền riêng',
    'Gói',
    'Trạng thái',
    'Email chủ',
    'SĐT chủ',
    'Ngày mua MKT',
    'Ngày tạo',
    'Hết hạn Pro',
  ];

  const rows = tenants.map((t) =>
    [
      t.brandName,
      t.slug,
      t.customDomain ?? '',
      t.subscription?.plan.name ?? 'FREE',
      t.status,
      t.ownerEmail ?? '',
      t.ownerPhone ?? '',
      t.purchasedAt ? t.purchasedAt.toLocaleDateString('vi-VN') : '',
      t.createdAt.toLocaleDateString('vi-VN'),
      t.subscription?.expiresAt ? t.subscription.expiresAt.toLocaleDateString('vi-VN') : '',
    ]
      .map(csvCell)
      .join(',')
  );

  const csv = '﻿' + [header.map(csvCell).join(','), ...rows].join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nguoi-thue.csv"',
    },
  });
}
