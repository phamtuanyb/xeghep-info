/**
 * Thành phần trình bày dùng CHUNG cho mọi theme và mọi trang public.
 * Dùng biến CSS `--brand` (do Shell của theme đặt theo tenant.primaryColor) để
 * giữ "nội dung tách khỏi giao diện": cùng dữ liệu, màu thương hiệu theo tenant.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import HeroSlideshowBg from '@/components/public/HeroSlideshowBg';
import { createLeadAction } from '@/app/public-actions';
import type { HomeRoute, HomeDriver } from './types';
import type { Banner, FaqItem, HowStep, WhyItem, HomeContentData } from '@/lib/home-content';
import { maskPlate } from '@/lib/mask';

export function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
    </div>
  );
}

/** Form đặt/tìm xe trên trang chủ — gửi GET sang /tim-chuyen (không cần JS). */
export function BookingSearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/tim-chuyen"
      method="get"
      className={`grid gap-3 ${compact ? 'md:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'}`}
    >
      <input
        name="from"
        placeholder="Điểm đi"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
      />
      <input
        name="to"
        placeholder="Điểm đến"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
      />
      <input
        type="date"
        name="date"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Tìm chuyến
      </button>
    </form>
  );
}

export function RouteCard({ route }: { route: HomeRoute }) {
  return (
    <Link
      href={`/tim-chuyen?from=${encodeURIComponent(route.fromName)}&to=${encodeURIComponent(route.toName)}`}
      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{route.icon ?? '🚗'}</span>
        <div>
          <div className="font-semibold text-slate-800">
            {route.fromName} → {route.toName}
          </div>
          <div className="text-sm text-slate-500">Từ {formatVnd(route.priceFrom)}</div>
        </div>
      </div>
      <span className="text-[color:var(--brand)] opacity-0 transition group-hover:opacity-100">→</span>
    </Link>
  );
}

export function DriverCard({ driver }: { driver: HomeDriver }) {
  return (
    <Link
      href={`/tai-xe-doi-tac/${driver.id}`}
      className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-bold text-slate-400">
        {driver.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={driver.avatarUrl} alt={driver.fullName} className="h-full w-full object-cover" />
        ) : (
          driver.fullName.charAt(0)
        )}
      </div>
      <div className="font-semibold text-slate-800">{driver.fullName}</div>
      {driver.carType && <div className="text-sm text-slate-500">{driver.carType}</div>}
      <div className="mt-1 text-sm text-amber-500">★ {driver.rating.toFixed(1)} · {driver.tripCount} chuyến</div>
    </Link>
  );
}

export function WhyChooseUs({ items }: { items: WhyItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-2 text-2xl">{it.icon ?? '✅'}</div>
          <div className="font-semibold text-slate-800">{it.title}</div>
          {it.desc && <p className="mt-1 text-sm text-slate-500">{it.desc}</p>}
        </div>
      ))}
    </div>
  );
}

export function HowToBook({ steps }: { steps: HowStep[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((s, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
            {i + 1}
          </div>
          <div className="font-semibold text-slate-800">{s.title}</div>
          {s.desc && <p className="mt-1 text-sm text-slate-500">{s.desc}</p>}
        </div>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {items.map((f, i) => (
        <details key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">{f.q}</summary>
          <p className="mt-2 text-sm text-slate-500">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ----------------------- HERO DÙNG CHUNG (mọi theme) ----------------------- */

/**
 * Nền hero dùng chung: ưu tiên nhiều ảnh banner (slideshow) -> 1 ảnh nền hero ->
 * gradient dự phòng. Đặt LÀM NỀN cho <section className="relative overflow-hidden">.
 * fallbackGradient: chuỗi class gradient của riêng theme (literal để Tailwind quét được).
 */
export function HeroBackdrop({
  banners,
  heroImageUrl,
  fallbackGradient = 'from-slate-800 to-slate-900',
}: {
  banners: Banner[];
  heroImageUrl?: string;
  fallbackGradient?: string;
}) {
  const imgs = banners.map((b) => b.imageUrl).filter((u): u is string => !!u);
  const hasImage = imgs.length > 0 || !!heroImageUrl;
  return (
    <>
      {imgs.length > 0 ? (
        <HeroSlideshowBg images={imgs} />
      ) : heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImageUrl} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 -z-20 bg-gradient-to-br ${fallbackGradient}`} />
      )}
      {/* Lớp phủ tối để chữ luôn đọc được khi có ảnh nền */}
      {hasImage && <div className="absolute inset-0 -z-10 bg-slate-900/55" />}
    </>
  );
}

const SERVICE_OPTIONS = [
  { value: 'ghep_1', label: '1 Ghế Ghép' },
  { value: 'ghep_2', label: '2 Ghế Ghép' },
  { value: 'bao_5', label: 'Bao xe 5 chỗ' },
  { value: 'bao_7', label: 'Bao xe 7 chỗ' },
  { value: 'gui_do', label: 'Gửi đồ' },
];

const inputCls =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[color:var(--brand)] focus:outline-none';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

/**
 * Form đặt xe dùng chung (mọi theme) — gửi thẳng server action createLeadAction:
 * tạo Booking (lead) + tự bắn Telegram về group của tenant. Gồm điểm đi/đến, ngày,
 * loại dịch vụ, HỌ TÊN, SỐ ĐIỆN THOẠI. redirectTo='/' để quay lại trang chủ.
 */
export function HeroBookingForm({
  hotline,
  buttonLabel = 'Đặt xe',
  redirectTo = '/',
  title = 'Đặt chuyến nhanh',
}: {
  hotline: string | null;
  buttonLabel?: string;
  redirectTo?: string;
  title?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
      <div className="mb-4 font-heading text-lg font-bold text-slate-800">{title}</div>
      <form action={createLeadAction} className="space-y-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Điểm đi">
            <input name="pickupAddr" required placeholder="VD: Yên Bái" className={inputCls} />
          </Field>
          <Field label="Điểm đến">
            <input name="dropoffAddr" required placeholder="VD: Hà Nội" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày đi">
            <input type="date" name="departDate" className={inputCls} />
          </Field>
          <Field label="Loại dịch vụ">
            <select name="serviceType" className={inputCls} defaultValue="ghep_1">
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Họ tên">
          <input name="customerName" required placeholder="VD: Nguyễn Văn A" className={inputCls} />
        </Field>
        <Field label="Số điện thoại">
          <input name="customerPhone" required type="tel" inputMode="tel" placeholder="VD: 0901 234 567" className={inputCls} />
        </Field>
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white hover:opacity-90"
        >
          {buttonLabel} →
        </button>
      </form>
      {hotline && (
        <p className="mt-3 text-center text-xs text-slate-400">
          Hotline hỗ trợ <span className="font-semibold text-slate-600">{hotline}</span>
        </p>
      )}
    </div>
  );
}

/* ------------------ THÂN TRANG CHỦ DÙNG CHUNG (mọi theme) ------------------ */

/** Thẻ tuyến lớn có ảnh/khoảng cách/giá/nút (kiểu landing). */
export function RouteBigCard({ route, highlight }: { route: HomeRoute; highlight?: boolean }) {
  const meta = [route.distanceKm ? `${route.distanceKm} km` : null, route.durationText]
    .filter(Boolean)
    .join(' · ');
  const href = `/tim-chuyen?from=${encodeURIComponent(route.fromName)}&to=${encodeURIComponent(route.toName)}`;
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
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

/**
 * Toàn bộ thân trang chủ (dưới hero): thẻ tin cậy, tuyến phổ biến, các bước, CTA tài
 * xế, FAQ. Dùng CHUNG cho mọi theme để Free/Pro nhất quán; màu nhấn theo --brand nên
 * mỗi tenant vẫn giữ thương hiệu. Theme chỉ khác nhau ở Shell (header/footer) + Hero.
 */
export function HomeSections({
  tenant,
  content,
  routes,
}: {
  tenant: { hotline: string | null };
  content: HomeContentData;
  routes: HomeRoute[];
}) {
  return (
    <>
      {/* THẺ TIN CẬY */}
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

      {/* CÁC BƯỚC */}
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
    </>
  );
}

export { maskPlate };
