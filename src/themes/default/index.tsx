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
import { formatVnd, HeroBackdrop, HeroBookingForm } from '../shared';
import type { HomeRoute } from '../types';
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

      {/* THẺ TIN CẬY (whyChooseUs) */}
      {content.whyChooseUs.length > 0 && (
        <section className="bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-5 px-4 py-12">
            {content.whyChooseUs.slice(0, 4).map((it, i) => (
              <div
                key={i}
                className="flex w-full flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-md sm:w-[250px]"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand)]/10 text-2xl text-[color:var(--brand)]">
                  {it.icon ?? '✅'}
                </div>
                <div className="font-semibold text-slate-800">{it.title}</div>
                {it.desc && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{it.desc}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TUYẾN PHỔ BIẾN */}
      {routes.length > 0 && (
        <section id="tuyen-pho-bien" className="bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--brand)]">Dịch vụ nổi bật</div>
              <h2 className="mt-1 font-heading text-2xl font-bold text-slate-800 md:text-3xl">Các tuyến phổ biến</h2>
              <p className="mt-2 text-slate-500">Chọn nhanh tuyến bạn cần, đặt chỗ ngay trong ngày.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {routes.map((r, i) => (
                <div key={r.id} className="w-full sm:w-[340px]">
                  <RouteBigCard route={r} highlight={i === 0} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4 BƯỚC (howToBook) */}
      {content.howToBook.length > 0 && (
        <section id="cach-dat" className="bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">
                Đặt xe ghép chỉ với {content.howToBook.length} bước
              </h2>
              <p className="mt-2 text-slate-500">Nhanh chóng, đơn giản và an toàn tuyệt đối cho hành trình của bạn.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {content.howToBook.map((s, i) => (
                <div
                  key={i}
                  className="flex w-full flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center sm:w-[230px]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] text-base font-bold text-white shadow-sm">
                    {i + 1}
                  </div>
                  <div className="mt-3 font-semibold text-slate-800">{s.title}</div>
                  {s.desc && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA TÀI XẾ */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-[var(--brand)] p-8 text-white md:grid-cols-2 md:p-12">
            <div>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">{content.driverCta.title}</h2>
              <p className="mt-3 max-w-md text-white/90">{content.driverCta.desc}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/tai-xe-doi-tac"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--brand)] hover:opacity-90"
                >
                  {content.driverCta.buttonLabel}
                </Link>
                <Link
                  href="/tai-xe/dang-nhap"
                  className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Đăng nhập tài xế
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/80">★ Chỉ chiết khấu hoa hồng minh bạch sau mỗi chuyến hoàn thành.</p>
            </div>
            <div className="hidden items-center justify-center md:flex">
              <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-white/10 text-6xl ring-1 ring-white/20">
                🚗
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ + gọi tổng đài */}
      {content.faq.length > 0 && (
        <section id="faq" className="bg-white py-14">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Bạn cần biết điều gì?</h2>
              <p className="mt-2 text-slate-500">Giải đáp nhanh các thắc mắc phổ biến khi đặt xe.</p>
            </div>
            <div className="space-y-3">
              {content.faq.map((f, i) => (
                <details
                  key={i}
                  open={i === 0}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 open:bg-white open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-800">
                    {f.q}
                    <span className="text-slate-400 transition group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-2 text-sm text-slate-500">{f.a}</p>
                </details>
              ))}
            </div>

            {tenant.hotline && (
              <div className="mt-8 rounded-2xl bg-[color:var(--brand)]/10 p-6 text-center">
                <div className="font-semibold text-slate-700">Còn thắc mắc khác?</div>
                <a
                  href={`tel:${tenant.hotline}`}
                  className="mt-3 inline-block rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  ☎ Gọi tổng đài {tenant.hotline}
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* --------------------------- SUBCOMPONENTS --------------------------- */

/** Thẻ tuyến lớn có ảnh/khoảng cách/giá/nút (kiểu landing). */
function RouteBigCard({ route, highlight }: { route: HomeRoute; highlight?: boolean }) {
  const meta = [route.distanceKm ? `${route.distanceKm} km` : null, route.durationText]
    .filter(Boolean)
    .join(' · ');
  const href = `/tim-chuyen?from=${encodeURIComponent(route.fromName)}&to=${encodeURIComponent(route.toName)}`;
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      {/* Vùng ảnh (gradient thương hiệu + icon, vì Route chưa có ảnh) */}
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[var(--brand)] to-slate-800 text-5xl text-white/90">
        {route.icon ?? '🚗'}
        {highlight && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[color:var(--brand)] shadow">
            Hot Route
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-800">
              {route.fromName} → {route.toName}
            </div>
            {meta && <div className="mt-0.5 text-xs text-slate-400">{meta}</div>}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[color:var(--brand)]">{formatVnd(route.priceFrom)}</div>
            <div className="text-[11px] text-slate-400">mỗi ghế</div>
          </div>
        </div>

        {/* Dải tuyến điểm đi -> điểm đến */}
        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium uppercase text-slate-400">
          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
          <span className="flex-1 truncate">{route.fromName}</span>
          <span className="flex-1 border-t border-dashed border-slate-200" />
          <span className="flex-1 truncate text-right">{route.toName}</span>
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>

        <Link
          href={href}
          className="mt-4 block rounded-xl border border-[color:var(--brand)] py-2.5 text-center text-sm font-semibold text-[color:var(--brand)] hover:bg-[color:var(--brand)]/5"
        >
          Xem chuyến →
        </Link>
      </div>
    </div>
  );
}

export const defaultTheme: ThemeModule = { key: 'default', name: 'Giao diện mặc định', Shell, Home };
