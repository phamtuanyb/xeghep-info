/**
 * Theme 'default' (gói Free) — bố cục landing xe ghép: hero ảnh phủ tối + form đặt
 * nhanh, dải thẻ tin cậy, tuyến phổ biến dạng thẻ ảnh, 4 bước, CTA tài xế, FAQ.
 *
 * NỘI DUNG TÁCH KHỎI GIAO DIỆN: mọi nội dung lấy từ props (HomeContent/Route...).
 * Màu nhấn dùng biến CSS `--brand` (Shell đặt theo tenant.primaryColor) -> mỗi tenant
 * giữ màu thương hiệu riêng mà vẫn chung 1 theme.
 */
import Link from 'next/link';
import TenantScripts from '@/components/public/TenantScripts';
import { HeroBackdrop, HeroBookingForm, HomeSections } from '../shared';
import type { ThemeModule, ThemeShellProps, ThemeHomeProps } from '../types';

const NAV = [
  { href: '/tim-chuyen', label: 'Tìm chuyến' },
  { href: '/#tuyen-pho-bien', label: 'Tuyến phổ biến' },
  { href: '/tintuc', label: 'Tin tức' },
  { href: '/tai-xe-doi-tac', label: 'Dành cho tài xế' },
];

/* ----------------------------- SHELL ----------------------------- */

function Shell({ tenant, showPoweredBy, children }: ThemeShellProps) {
  const brand = tenant.primaryColor || '#EA580C';
  const year = new Date().getFullYear();
  return (
    <div
      data-theme="default"
      style={{ ['--brand' as string]: brand }}
      className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800"
    >
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.brandName} className="h-8 w-auto" />
            ) : (
              <span className="font-heading text-xl font-extrabold text-[color:var(--brand)]">{tenant.brandName}</span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-[color:var(--brand)]"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/tai-khoan/dang-nhap"
              className="hidden text-sm font-medium text-slate-600 hover:text-[color:var(--brand)] sm:block"
            >
              Đăng nhập
            </Link>
            <Link
              href="/tim-chuyen"
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Đặt xe ngay
            </Link>
          </div>
        </div>

        {/* Nav mobile */}
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-sm text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="font-heading text-lg font-extrabold text-[color:var(--brand)]">{tenant.brandName}</div>
            <p className="mt-3 text-white/60">
              Nền tảng kết nối xe ghép, đón trả tận nơi, tài xế đã xác thực.
            </p>
            {tenant.hotline && (
              <a href={`tel:${tenant.hotline}`} className="mt-3 inline-block font-semibold text-[color:var(--brand)]">
                ☎ {tenant.hotline}
              </a>
            )}
          </div>

          <FooterCol
            title="Khám phá"
            links={[
              { href: '/tim-chuyen', label: 'Tìm chuyến' },
              { href: '/#tuyen-pho-bien', label: 'Tuyến phổ biến' },
              { href: '/#cach-dat', label: 'Cách đặt chuyến' },
              { href: '/#faq', label: 'Câu hỏi thường gặp' },
            ]}
          />
          <FooterCol
            title="Tài xế"
            links={[
              { href: '/tai-xe-doi-tac', label: 'Đăng ký tài xế' },
              { href: '/tai-xe/dang-nhap', label: 'Đăng nhập tài xế' },
              { href: '/tai-xe-doi-tac', label: 'Quy định & hoa hồng' },
            ]}
          />
          <FooterCol
            title="Hỗ trợ"
            links={[
              { href: '/tai-khoan/dang-nhap', label: 'Tài khoản khách' },
              { href: '/tintuc', label: 'Tin tức' },
              ...(tenant.hotline ? [{ href: `tel:${tenant.hotline}`, label: `Tổng đài ${tenant.hotline}` }] : []),
            ]}
          />
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>© {year} {tenant.brandName}. Nền tảng kết nối xe ghép vùng cao tin cậy.</span>
            {showPoweredBy && <span>Cung cấp bởi MKT — Nền tảng website xe ghép.</span>}
          </div>
        </div>
      </footer>

      <TenantScripts tenantId={tenant.id} />
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-3 font-semibold text-white">{title}</div>
      <ul className="space-y-2">
        {links.map((l, i) => (
          <li key={i}>
            <Link href={l.href} className="text-white/60 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------- HOME ----------------------------- */

function Home({ tenant, content, routes }: ThemeHomeProps) {
  return (
    <div>
      {/* HERO: nền ảnh/slideshow banner + form đặt xe (cấu trúc chung) */}
      <section className="relative isolate overflow-hidden bg-slate-900">
        <HeroBackdrop banners={content.banners} heroImageUrl={content.hero.imageUrl} />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          {/* Text trái */}
          <div className="text-white">
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mt-4 max-w-lg text-white/85">{content.hero.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                <span className="text-[color:var(--brand)]">✓</span> Xe chạy mỗi ngày
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                <span className="text-[color:var(--brand)]">✓</span> Đón trả tận nơi
              </span>
            </div>
          </div>

          {/* Form đặt nhanh phải */}
          <div className="md:justify-self-end md:w-[400px]">
            <HeroBookingForm hotline={tenant.hotline} />
          </div>
        </div>
      </section>

      {/* Thân trang: thẻ tin cậy, tuyến, các bước, CTA, FAQ (dùng chung mọi theme) */}
      <HomeSections tenant={tenant} content={content} routes={routes} />
    </div>
  );
}

export const defaultTheme: ThemeModule = { key: 'default', name: 'Giao diện mặc định', Shell, Home };
