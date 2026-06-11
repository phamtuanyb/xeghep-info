import Link from 'next/link';
import type { ReactNode } from 'react';
import TenantScripts from '@/components/public/TenantScripts';
import ImageSlideshow from '@/components/public/ImageSlideshow';
import { createLeadAction } from '@/app/public-actions';
import { HeroBackdrop, formatVnd } from '../shared';
import type { ThemeModule, ThemeShellProps, ThemeHomeProps, HomeRoute } from '../types';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/#tuyen-pho-bien', label: 'Tuyến xe' },
  { href: '/#quy-trinh', label: 'Quy trình' },
  { href: '/tai-xe-doi-tac', label: 'Về chúng tôi' },
  { href: '/#danh-gia', label: 'Đánh giá' },
];

function Shell({ tenant, showPoweredBy, children }: ThemeShellProps) {
  const brand = tenant.primaryColor || '#2D8CFF';
  const year = new Date().getFullYear();

  return (
    <div data-theme="theme-a" style={{ ['--brand' as string]: brand }} className="min-h-screen bg-[#EEF4FB] text-slate-800">
      <div className="sticky top-0 z-30 px-3 pt-3 md:px-5">
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl bg-white/95 px-4 py-3 shadow-[0_10px_32px_rgba(15,23,42,0.10)] backdrop-blur md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-xs font-extrabold uppercase text-white shadow-[0_8px_20px_rgba(30,136,229,0.32)]">
              xe
            </span>
            <div className="font-heading text-lg font-extrabold leading-none text-[#14325D] md:text-xl">
              xeghep<span className="text-[#FF9A1F]">.info</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-[#14325D]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {tenant.hotline && (
              <a
                href={`tel:${tenant.hotline}`}
                className="hidden items-center gap-2 rounded-full bg-[#F4F8FE] px-3.5 py-2 text-sm font-bold text-[var(--brand)] shadow-[0_4px_14px_rgba(30,136,229,0.12)] md:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow-sm">☎</span>
                <span>{tenant.hotline}</span>
              </a>
            )}
            <Link
              href="/tim-chuyen"
              className="rounded-full bg-[#FF9A1F] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(255,154,31,0.32)] transition hover:translate-y-[-1px] md:px-5 md:text-sm"
            >
              Đặt xe ngay
            </Link>
          </div>
        </header>
      </div>

      <main>{children}</main>

      <footer className="bg-[#173E78] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-xs font-extrabold uppercase text-white">xe</span>
              <div className="font-heading text-lg font-extrabold leading-none md:text-xl">
                xeghep<span className="text-[#FF9A1F]">.info</span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/72">
              Nền tảng đặt xe ghép trực tuyến uy tín toàn quốc. Đón trả tận nơi, đúng giờ, giá minh bạch.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { label: 'Facebook', mark: 'f' },
                { label: 'Zalo', mark: 'Z' },
                { label: 'TikTok', mark: '♪' },
              ].map((item) => (
                <span key={item.label} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/85 text-base font-bold text-white">
                  {item.mark}
                </span>
              ))}
            </div>
          </div>

          <FooterCol
            title="Tuyến phổ biến"
            links={[
              { href: '/tim-chuyen?from=Hà%20Nội&to=Yên%20Bái', label: 'Hà Nội ↔ Yên Bái' },
              { href: '/tim-chuyen?from=Hà%20Nội&to=Nghĩa%20Lộ', label: 'Hà Nội ↔ Nghĩa Lộ' },
              { href: '/tim-chuyen?from=Hà%20Nội&to=Văn%20Chấn', label: 'Hà Nội ↔ Văn Chấn' },
              { href: '/tim-chuyen?from=Hà%20Nội&to=Lào%20Cai', label: 'Hà Nội ↔ Lào Cai' },
              { href: '/tim-chuyen?from=Hà%20Nội&to=Sa%20Pa', label: 'Hà Nội ↔ Sa Pa' },
            ]}
          />
          <FooterCol
            title="Hỗ trợ"
            links={[
              { href: '/#quy-trinh', label: 'Hướng dẫn đặt xe' },
              { href: '/tai-khoan/dang-nhap', label: 'Điều khoản sử dụng' },
              { href: '/tai-khoan/dang-ky', label: 'Chính sách bảo mật' },
              { href: '/#danh-gia', label: 'Câu hỏi thường gặp' },
            ]}
          />
          <div>
            <div className="mb-4 text-base font-bold text-white">Liên hệ</div>
            {tenant.hotline && (
              <a
                href={`tel:${tenant.hotline}`}
                className="flex items-center gap-3 rounded-2xl bg-[#FF9A1F] px-4 py-3.5 text-[#173E78] shadow-[0_12px_28px_rgba(255,154,31,0.30)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base text-[#FF9A1F]">☎</span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#173E78]/70">Hotline 24/7</span>
                  <span className="text-xl font-extrabold leading-none text-white">{tenant.hotline}</span>
                </span>
              </a>
            )}
            <div className="mt-5 space-y-3 text-sm leading-7 text-white/80">
              <div>contact@xeghep.info</div>
              <div>Tầng 5, Tòa nhà ABC, Cầu Giấy, Hà Nội</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
            <span>© {year} xeghep.info - Đặt xe ghép toàn quốc</span>
            <div className="flex flex-wrap gap-5">
              <span>Điều khoản</span>
              <span>Bảo mật</span>
              <span>Sitemap</span>
              {showPoweredBy && <span>Powered by MKT</span>}
            </div>
          </div>
        </div>
      </footer>

      <TenantScripts tenantId={tenant.id} />
    </div>
  );
}

function Home({ tenant, content, routes, drivers }: ThemeHomeProps) {
  const featuredRoutes = routes.slice(0, 6);
  const featureItems = content.whyChooseUs.slice(0, 4);
  const heroStats = content.hero.stats;
  const titleLines = content.hero.title.split('\n').map((s) => s.trim()).filter(Boolean);
  const about = content.about;
  const aboutImages = about.images.length ? about.images : [content.banners[0]?.imageUrl, content.hero.imageUrl].filter(Boolean) as string[];
  const review = drivers[0];

  return (
    <div>
      <section className="relative overflow-hidden pb-8 pt-4 text-white">
        <HeroBackdrop
          banners={content.banners}
          heroImageUrl={content.hero.imageUrl}
          fallbackGradient="from-[#173E78] via-[#1E63C1] to-[#2D8CFF]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),linear-gradient(115deg,rgba(20,61,120,0.96),rgba(46,140,255,0.92))]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 pb-10 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-12">
          <div className="pt-4">
            {content.hero.badge && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD63D] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#14325D] shadow-[0_8px_22px_rgba(255,214,61,0.32)]">
                <span>$</span>
                <span>{content.hero.badge}</span>
              </div>
            )}
            <h1 className="mt-5 max-w-3xl font-heading text-3xl font-extrabold uppercase tracking-tight md:text-5xl">
              {titleLines.map((line, i) => (
                <span
                  key={i}
                  className={`block leading-[1.5] ${i === titleLines.length - 1 && titleLines.length > 1 ? 'text-[#FF9A1F]' : ''}`}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/88">
              {content.hero.subtitle || 'Kết nối hành khách với hàng trăm nhà xe uy tín. Đặt chuyến chỉ trong 1 phút — minh bạch, đúng giờ, tiện lợi.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {featureItems.map((item, index) => (
                <span
                  key={`${item.title}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-[10px] font-bold text-white">✓</span>
                  {item.title}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/tim-chuyen"
                className="rounded-full bg-[#FF9A1F] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(255,154,31,0.32)] transition hover:translate-y-[-1px]"
              >
                {content.hero.ctaLabel}
              </Link>
              {content.hero.ctaSecondaryLabel && (
                <Link
                  href="/#tuyen-pho-bien"
                  className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur"
                >
                  {content.hero.ctaSecondaryLabel}
                </Link>
              )}
            </div>

            <div className="mt-9 grid max-w-xl gap-5 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label}>
                  <div className="text-2xl font-extrabold leading-none text-[#FFD63D] md:text-3xl">{item.value}</div>
                  <div className="mt-1.5 text-sm font-semibold text-white/80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pt-4">
            <PremiumHeroBookingForm hotline={tenant.hotline} />
          </div>
        </div>
      </section>

      <section className="bg-[#EEF4FB]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-5 px-4 py-10">
          {featureItems.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="w-full rounded-3xl border border-[#D7E6FA] bg-white p-5 shadow-[0_14px_34px_rgba(30,99,193,0.10)] sm:w-[260px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF9A1F] text-base font-extrabold text-white shadow-[0_10px_22px_rgba(255,154,31,0.26)]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="mt-4 text-lg font-extrabold leading-tight text-[#14325D]">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.desc || 'Trải nghiệm chuyến đi an tâm, gọn gàng và dễ chịu hơn cho mọi hành trình.'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#FF9A1F]">{about.eyebrow}</div>
            <h2 className="mt-3 max-w-xl font-heading text-2xl font-extrabold leading-tight text-[#14325D] md:text-3xl">
              {about.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{about.description}</p>

            <div className="mt-6 space-y-3">
              {about.bullets.map((item) => (
                <div key={item} className="flex items-center gap-3 text-[15px] font-bold text-[#14325D]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22C55E] text-sm font-bold text-white shadow-[0_8px_18px_rgba(34,197,94,0.25)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/tim-chuyen"
              className="mt-8 inline-flex rounded-full bg-[#FF9A1F] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(255,154,31,0.28)]"
            >
              Đặt xe ngay
            </Link>
          </div>

          <div className="relative">
            <div className="absolute right-4 top-0 z-10 rounded-full bg-[#FFD63D] px-4 py-2 text-sm font-extrabold text-[#14325D] shadow-[0_12px_24px_rgba(255,214,61,0.30)]">
              ★ 4.9 / 5.0
            </div>
            <div className="overflow-hidden rounded-[28px] border border-[#DCE9FA] bg-[#F6FAFF] p-3 shadow-[0_24px_56px_rgba(16,56,104,0.10)]">
              {aboutImages.length > 0 ? (
                <ImageSlideshow images={aboutImages} className="h-[360px] w-full rounded-[22px] md:h-[420px]" />
              ) : (
                <div className="flex h-[360px] items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#173E78,#2D8CFF)] text-center text-white/80 md:h-[420px]">
                  <div>
                    <div className="text-xl font-bold">Hình ảnh Limousine cao cấp</div>
                    <div className="mt-2 text-sm">Không gian sạch sẽ, thoải mái và đón trả tận nơi.</div>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-[-16px] left-[-12px] rounded-2xl bg-white px-5 py-4 shadow-[0_22px_46px_rgba(16,56,104,0.16)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)] text-base font-bold text-white">KH</span>
                <div>
                  <div className="text-2xl font-extrabold leading-none text-[#14325D]">600.000+</div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">khách hàng tin chọn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tuyen-pho-bien" className="bg-[#EEF4FB] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#FF9A1F]">Tuyến phổ biến</div>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-[#14325D] md:text-3xl">Các tuyến xe được đặt nhiều nhất</h2>
            <p className="mt-3 text-base text-slate-600">Chọn tuyến — chúng tôi tự điền sẵn điểm đón & điểm trả cho bạn.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredRoutes.map((route) => (
              <PremiumRouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#FF9A1F]">Quy trình đặt xe</div>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-[#14325D] md:text-3xl">
              Chỉ {Math.max(4, content.howToBook.length + 1)} bước đơn giản
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Tìm tuyến xe', desc: 'Chọn tuyến và loại xe phù hợp với hành trình.' },
              ...content.howToBook,
            ]
              .slice(0, 4)
              .map((step, index) => (
                <div key={`${step.title}-${index}`} className="relative text-center">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1E63C1,#48A0FF)] text-xl font-extrabold text-white shadow-[0_14px_32px_rgba(30,99,193,0.24)]">
                    <span className="absolute right-[-6px] top-[-6px] flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8F12] text-xs text-white shadow-[0_8px_16px_rgba(255,143,18,0.28)]">
                      {index + 1}
                    </span>
                    •
                  </div>
                  <div className="absolute left-[calc(50%+40px)] top-8 hidden h-px w-[calc(100%-36px)] border-t-2 border-dashed border-[#86BAFF] xl:block" />
                  <div className="mt-5 text-lg font-extrabold text-[#14325D]">{step.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.desc || 'Điền thông tin đặt xe chỉ trong 1 phút.'}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section id="danh-gia" className="relative overflow-hidden bg-[linear-gradient(115deg,#173E78,#2D8CFF)] py-16 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.75) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#FFD63D]">Khách hàng nói gì</div>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-white md:text-3xl">Hơn 12.000 đánh giá 5 sao</h2>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-white/15 bg-white/12 p-6 text-center shadow-[0_22px_50px_rgba(8,28,61,0.22)] backdrop-blur md:p-8">
            <div className="text-lg tracking-[0.5em] text-[#FFD63D]">★★★★★</div>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-white md:text-xl">
              “Dịch vụ rất chuyên nghiệp, xe sạch sẽ, đúng giờ. Tài xế thân thiện, đón tận nhà rất tiện lợi. Mình sẽ tiếp tục ủng hộ!”
            </p>
            <div className="mt-7 flex items-center justify-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 text-xl font-extrabold">
                {review?.fullName?.charAt(0) ?? 'N'}
              </div>
              <div className="text-left">
                <div className="text-lg font-extrabold text-white">{review?.fullName ?? 'Nguyễn Văn An'}</div>
                <div className="text-sm text-white/70">
                  {review?.carType ? `${review.carType} · ` : ''}{featuredRoutes[0]?.fromName ?? 'Hà Nội'} → {featuredRoutes[0]?.toName ?? 'Sa Pa'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-4 text-base font-bold text-white">{title}</div>
      <ul className="space-y-2.5 text-sm text-white/78">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PremiumHeroBookingForm({ hotline }: { hotline: string | null }) {
  return (
    <div className="rounded-3xl bg-white p-5 text-slate-800 shadow-[0_24px_60px_rgba(15,23,42,0.18)] md:p-6">
      <div className="inline-flex translate-y-[-16px] items-center gap-2 rounded-full bg-[#FFD63D] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#14325D] shadow-[0_12px_24px_rgba(255,214,61,0.32)]">
        <span>+</span>
        <span>Giá tốt nhất hôm nay</span>
      </div>
      <div className="mt-[-4px] flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF9A1F] text-xs font-extrabold uppercase text-white">xe</span>
        <div>
          <div className="font-heading text-xl font-extrabold leading-none text-[#14325D] md:text-2xl">Đặt chuyến xe</div>
          <div className="mt-1 text-sm text-slate-500">Phản hồi & xác nhận trong 5 phút</div>
        </div>
      </div>

      <form action={createLeadAction} className="mt-6 space-y-3.5">
        <input type="hidden" name="redirectTo" value="/" />
        <LabelledField label="Điểm đón">
          <FieldWithIcon icon="⌖">
            <input name="pickupAddr" required className={fieldInputCls} />
          </FieldWithIcon>
        </LabelledField>
        <LabelledField label="Điểm trả khách">
          <FieldWithIcon icon="⚑">
            <input name="dropoffAddr" required className={fieldInputCls} />
          </FieldWithIcon>
        </LabelledField>
        <div className="grid gap-3.5 md:grid-cols-2">
          <LabelledField label="Ngày đi">
            <FieldWithIcon icon="◷">
              <input type="date" name="departDate" className={fieldInputCls} />
            </FieldWithIcon>
          </LabelledField>
          <LabelledField label="Họ và tên">
            <FieldWithIcon icon="◌">
              <input name="customerName" required className={fieldInputCls} />
            </FieldWithIcon>
          </LabelledField>
        </div>
        <LabelledField label="Số điện thoại">
          <FieldWithIcon icon="☎">
            <input name="customerPhone" required type="tel" inputMode="tel" className={fieldInputCls} />
          </FieldWithIcon>
        </LabelledField>

        <div>
          <LabelledField label="Chọn dịch vụ">
            <FieldWithIcon icon="▾">
              <select name="serviceType" defaultValue="ghep_1" className={fieldInputCls}>
                <option value="ghep_1">Ghép 1 ghế</option>
                <option value="ghep_2">Ghép 2 ghế</option>
                <option value="bao_5">Bao xe 5 chỗ</option>
                <option value="bao_7">Bao xe 7 chỗ</option>
                <option value="gui_do">Gửi đồ</option>
                <option value="cuoi_hoi">Cưới hỏi</option>
                <option value="du_lich">Du lịch</option>
              </select>
            </FieldWithIcon>
          </LabelledField>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-[#FF9A1F] px-6 py-3.5 text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(255,154,31,0.32)] transition hover:translate-y-[-1px]"
        >
          Xác nhận đặt xe
        </button>
      </form>

      <div className="mt-4 text-center text-xs font-medium text-slate-500">
        {hotline ? `Miễn phí đặt xe · Không cần thanh toán trước · Hotline ${hotline}` : 'Miễn phí đặt xe · Không cần thanh toán trước'}
      </div>
    </div>
  );
}

function LabelledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#14325D]">{label}</span>
      {children}
    </label>
  );
}

function FieldWithIcon({
  icon,
  children,
  alignTop = false,
}: {
  icon: string;
  children: ReactNode;
  alignTop?: boolean;
}) {
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 ${alignTop ? 'top-3.5' : 'top-1/2 -translate-y-1/2'} text-base text-[var(--brand)]/90`}>
        {icon}
      </span>
      {children}
    </div>
  );
}

function PremiumRouteCard({ route }: { route: HomeRoute }) {
  const meta = [route.distanceKm ? `${route.distanceKm} km` : null, route.durationText || null].filter(Boolean) as string[];
  const href = `/tim-chuyen?from=${encodeURIComponent(route.fromName)}&to=${encodeURIComponent(route.toName)}`;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_36px_rgba(16,56,104,0.10)]">
      <div
        className="px-5 py-4 text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(23,62,120,0.98), rgba(45,140,255,0.92))',
        }}
      >
        <div className="flex items-center justify-between gap-3 text-lg font-extrabold md:text-xl">
          <span>{route.fromName}</span>
          <span className="text-sm text-white/75">· · ·</span>
          <span>{route.toName}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500">
            {meta.map((item) => (
              <span key={`${route.id}-${item}`}>{item}</span>
            ))}
          </div>
          <div className="mt-3 text-xs font-semibold text-slate-500">Giá chỉ từ</div>
          <div className="text-2xl font-extrabold leading-none text-[#FF8F12] md:text-3xl">{formatVnd(route.priceFrom)}</div>
        </div>
        <Link
          href={href}
          className="rounded-full bg-[#FF9A1F] px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_12px_26px_rgba(255,154,31,0.28)]"
        >
          Đặt xe
        </Link>
      </div>
    </div>
  );
}

const fieldInputCls =
  'w-full rounded-2xl border border-[#D7E5F7] bg-[#F7FAFE] py-3 pl-11 pr-4 text-[15px] text-slate-700 outline-none transition focus:border-[var(--brand)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(30,136,229,0.08)]';

export const auroraTheme: ThemeModule = {
  key: 'theme-a',
  name: 'Giao diện Năng động',
  Shell,
  Home,
};
