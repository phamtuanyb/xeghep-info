/**
 * Health + nhận diện tenant theo host. Dùng để xác thực tên miền riêng
 * (custom-domain.ts gọi https://<domain>/api/health rồi so khớp tenantId).
 */
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { resolveTenantByHost } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const h = headers();
  const host = h.get('x-tenant-host') ?? h.get('host') ?? '';
  const slug = h.get('x-tenant-slug');
  const result = await resolveTenantByHost(host, slug);
  return NextResponse.json({
    status: 'ok',
    tenantId: result.ok ? result.tenant.id : null,
  });
}
