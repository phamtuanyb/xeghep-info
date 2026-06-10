/**
 * Theme 'theme-c' (Hoàng hôn, gói Pro) — tông ấm, hero ảnh phủ kính + form nổi,
 * điều hướng dạng viên thuốc canh giữa, tuyến hiển thị theo dải ngang.
 * CÙNG dữ liệu với các theme khác (ThemeShellProps/ThemeHomeProps), chỉ khác cách render.
 */
import Link from 'next/link';
import TenantScripts from '@/components/public/TenantScripts';
import {
  HeroBackdrop,
  HeroBookingForm,
  RouteCard,
  DriverCard,
  WhyChooseUs,
  HowToBook,
  FaqList,
  SectionHeading,
} from '../shared';
import type { ThemeModule, ThemeShellProps, ThemeHomeProps } from '../types';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/tim-chuyen', label: 'Tìm chuyến' },
  { href: '/tai-xe-doi-tac', label: 'Đội ngũ tài xế' },
  { href: '/tintuc', label: 'Tin tức' },
];

function Shell({ tenant, showPoweredBy, children }: ThemeShellProps) {
  const brand = tenant.primaryColor || '#EA580C';
  return (
    <div
      data-theme="theme-c"
      style={{ ['--brand' as string]: brand }}
      className="flex min-h-screen flex-col bg-orange-50 text-slate-800"
    >
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-orange-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3 md:flex-row md:justify-between">
          <Link href="/" className="flex items-center gap-2">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.brandName} className="h-9 w-auto" />
            ) : (
              <span className="font-heading text-xl font-extrabold text-[color:var(--brand)]">{tenant.brandName}</span>
            )}
          </Link>
          <nav className="flex items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-orange-100 hover:text-[color:var(--brand)]"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {tenant.hotline && (
              <a
                href={`tel:${tenant.hotline}`}
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                ☎ {tenant.hotline}
              </a>
            )}
            <Link
              href="/tai-khoan/ho-so"
              className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-orange-100"
            >
              Tài khoản
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-white/70">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm">
          <div className="font-heading text-xl font-extrabold text-[color:var(--brand)]">{tenant.brandName}</div>
          {tenant.hotline && <p className="mt-1">Hotline: {tenant.hotline}</p>}
          <p className="mt-4 text-xs text-white/40">© {tenant.brandName}. Mọi quyền được bảo lưu.</p>
          {showPoweredBy && (
            <p className="mt-1 text-xs text-white/40">Cung cấp bởi MKT — Nền tảng website xe ghép.</p>
          )}
        </div>
      </footer>

      <TenantScripts tenantId={tenant.id} />
    </div>
  );
}

function Home({ tenant, content, routes, drivers }: ThemeHomeProps) {
  return (
    <div>
      {/* Hero: nền ảnh/slideshow banner (gradient hoàng hôn dự phòng) + form đặt xe */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroBackdrop
          banners={content.banners}
          heroImageUrl={content.hero.imageUrl}
          fallbackGradient="from-amber-400 via-orange-500 to-rose-600"
        />
        <div className="mx-auto max-w-3xl px-4 pt-16 text-center">
          <h1 className="font-heading text-4xl font-extrabold drop-shadow md:text-5xl">{content.hero.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">{content.hero.subtitle}</p>
        </div>
        <div className="mx-auto max-w-md px-4 pb-16 pt-8">
          <HeroBookingForm hotline={tenant.hotline} buttonLabel="Đặt xe" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
        {routes.length > 0 && (
          <section>
            <SectionHeading title="Tuyến phổ biến" subtitle="Chọn nhanh tuyến bạn cần" />
            {/* Dải ngang cuộn được trên mobile, lưới trên desktop */}
            <div className="grid gap-4 sm:grid-cols-2">
              {routes.map((r) => (
                <RouteCard key={r.id} route={r} />
              ))}
            </div>
          </section>
        )}

        {/* "Vì sao" trên nền thẻ ấm */}
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <SectionHeading title="Vì sao chọn chúng tôi" />
          <WhyChooseUs items={content.whyChooseUs} />
        </section>

        <section>
          <SectionHeading title="Cách đặt xe" />
          <HowToBook steps={content.howToBook} />
        </section>

        {drivers.length > 0 && (
          <section>
            <SectionHeading title="Đội ngũ tài xế" subtitle="Tài xế đã được xác thực" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {drivers.map((d) => (
                <DriverCard key={d.id} driver={d} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading title="Câu hỏi thường gặp" />
          <FaqList items={content.faq} />
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 p-10 text-center text-white shadow-lg">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">{content.driverCta.title}</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">{content.driverCta.desc}</p>
          <Link
            href="/tai-xe-doi-tac"
            className="mt-5 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--brand)] shadow-md hover:opacity-90"
          >
            {content.driverCta.buttonLabel}
          </Link>
        </section>
      </div>
    </div>
  );
}

export const sunsetTheme: ThemeModule = { key: 'theme-c', name: 'Giao diện Hoàng hôn', Shell, Home };
