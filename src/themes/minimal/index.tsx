/**
 * Theme 'theme-b' (Tối giản, gói Pro) — nền trắng, viền mảnh, góc vuông.
 * CÙNG dữ liệu với các theme khác, chỉ khác cách render.
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
  const brand = tenant.primaryColor || '#0F172A';
  return (
    <div data-theme="theme-b" style={{ ['--brand' as string]: brand }} className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b-2 border-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-heading text-lg font-bold uppercase tracking-wide">
            {tenant.brandName}
          </Link>
          <nav className="hidden gap-6 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {tenant.hotline && (
              <a href={`tel:${tenant.hotline}`} className="hidden text-sm font-semibold text-slate-900 sm:block">
                ☎ {tenant.hotline}
              </a>
            )}
            <Link href="/tai-khoan/ho-so" className="border border-slate-900 px-3 py-1.5 text-sm hover:bg-slate-900 hover:text-white">
              Tài khoản
            </Link>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-sm font-medium text-slate-600">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t-2 border-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-600">
          <div className="font-heading text-lg font-bold uppercase">{tenant.brandName}</div>
          {tenant.hotline && <p className="mt-1">Hotline: {tenant.hotline}</p>}
          <p className="mt-4 text-xs text-slate-400">© {tenant.brandName}. Mọi quyền được bảo lưu.</p>
          {showPoweredBy && <p className="mt-1 text-xs text-slate-400">Cung cấp bởi MKT — Nền tảng website xe ghép.</p>}
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
          fallbackGradient="from-slate-900 to-slate-700"
        />
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">{content.hero.title}</h1>
            <p className="mt-4 max-w-xl text-white/85">{content.hero.subtitle}</p>
          </div>
          <div className="md:justify-self-end md:w-[400px]">
            <HeroBookingForm hotline={tenant.hotline} buttonLabel="Đặt xe" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">
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

      <section className="border-2 border-slate-900 p-8 text-center">
        <h2 className="font-heading text-2xl font-bold">{content.driverCta.title}</h2>
        <p className="mt-2 text-slate-500">{content.driverCta.desc}</p>
        <Link href="/tai-xe-doi-tac" className="mt-4 inline-block bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
          {content.driverCta.buttonLabel}
        </Link>
      </section>
      </div>
    </div>
  );
}

export const minimalTheme: ThemeModule = { key: 'theme-b', name: 'Giao diện Tối giản', Shell, Home };
