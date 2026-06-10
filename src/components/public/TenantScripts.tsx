/**
 * Nhúng GA4 theo tenant (CLAUDE.md Mục 13). Đặt trong Shell của mọi theme nên xuất
 * hiện trên toàn site công khai. Search Console verification + robots noindex xử lý
 * qua metadata (lib/seo.ts).
 */
import Script from 'next/script';
import { dbAdmin } from '@/lib/db';

export default async function TenantScripts({ tenantId }: { tenantId: string }) {
  const setting = await dbAdmin.tenantSetting.findUnique({
    where: { tenantId },
    select: { ga4Id: true },
  });
  const ga4 = setting?.ga4Id?.trim();
  if (!ga4) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}
      </Script>
    </>
  );
}
