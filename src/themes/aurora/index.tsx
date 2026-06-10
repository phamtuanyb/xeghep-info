/**
 * Theme 'theme-a' (Năng động, gói Pro) — header tối, hero gradient nổi bật.
 * CÙNG dữ liệu với theme default, chỉ khác cách render.
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
  const brand = tenant.primaryColor || '#7C3AED';
  return (
    <div data-theme="theme-a" style={{ ['--brand' as string]: brand }} className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-20 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-heading text-xl font-extrabold">
            {tenant.brandName}
          </Link>
          <nav className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {tenant.hotline && (
              <a href={`tel:${tenant.hotline}`} className="hidden rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold sm:block">
                ☎ {tenant.hotline}
              </a>
            )}
            <Link href="/tai-khoan/ho-so" className="rounded-full border border-white/30 px-3 py-2 text-sm hover:bg-white/10">
              Tài khoản
            </Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-white/70">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
          <div className="font-heading text-xl font-extrabold text-white">{tenant.brandName}</div>
          {tenant.hotline && <p className="mt-1">Hotline: {tenant.hotline}</p>}
          <p className="mt-4 text-xs text-white/40">© {tenant.brandName}. Mọi quyền được bảo lưu.</p>
          {showPoweredBy && <p className="mt-1 text-xs text-white/40">Cung cấp bởi MKT — Nền tảng website xe ghép.</p>}
        </div>
      </footer>

      <TenantScripts tenantId={tenant.id} />
    </div>
  );
}

function Home({ tenant, content, routes, drivers }: ThemeHomeProps) {
  return (
    <div>
      {/* Hero: nền ảnh/slideshow banner + form đặt xe (cấu trúc chung) */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroBackdrop
          banners={content.banners}
          heroImageUrl={content.hero.imageUrl}
          fallbackGradient="from-[var(--brand)] via-fuchsia-600 to-slate-900"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-heading text-4xl font-extrabold drop-shadow md:text-5xl">{content.hero.title}</h1>
            <p className="mt-4 max-w-xl text-white/90">{content.hero.subtitle}</p>
          </div>
          <div className="md:justify-self-end md:w-[400px]">
            <HeroBookingForm hotline={tenant.hotline} buttonLabel="Đặt xe" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
        {routes.length > 0 && (
          <section>
            <SectionHeading title="Tuyến phổ biến" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {routes.map((r) => (
                <RouteCard key={r.id} route={r} />
              ))}
            </div>
          </section>
        )}

        <section>
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

        <section className="rounded-3xl bg-gradient-to-r from-[var(--brand)] to-fuchsia-600 p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">{content.driverCta.title}</h2>
          <p className="mt-2 text-white/90">{content.driverCta.desc}</p>
          <Link href="/tai-xe-doi-tac" className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--brand)]">
            {content.driverCta.buttonLabel}
          </Link>
        </section>
      </div>
    </div>
  );
}

export const auroraTheme: ThemeModule = { key: 'theme-a', name: 'Giao diện Năng động', Shell, Home };
