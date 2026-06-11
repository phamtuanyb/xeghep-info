/**
 * Trang giới thiệu NỀN TẢNG (marketing cho MKT) — hiển thị tại tên miền gốc xeghep.info.
 * Tự chứa, KHÔNG phụ thuộc tenant (gốc không thuộc nhà xe nào). Tiếng Việt, hướng tới
 * người làm nghề xe ghép muốn có website thương hiệu riêng.
 *
 * Sửa thông tin liên hệ (hotline/email) bên dưới theo thực tế của bạn.
 */
import Link from 'next/link';

const HOTLINE = '0941 113 119';
const EMAIL = 'lienhe@xeghep.info';

const FEATURES = [
  { icon: '🌐', title: 'Website thương hiệu riêng', desc: 'Mỗi nhà xe một site riêng trên subdomain, hoặc gắn tên miền riêng (gói Pro).' },
  { icon: '📩', title: 'Nhận đặt xe tức thì', desc: 'Khách đặt chuyến → thông tin về ngay Telegram của bạn, kèm IP & thiết bị.' },
  { icon: '🚗', title: 'Quản lý vận hành', desc: 'Tuyến, chuyến, tài xế, KYC, giao dịch, khiếu nại — gọn trong một trang quản trị.' },
  { icon: '🎨', title: 'Nhiều giao diện', desc: 'Chọn giao diện đẹp dựng sẵn, đổi theme không mất nội dung.' },
  { icon: '🔎', title: 'Chuẩn SEO, tải nhanh', desc: 'Sitemap, metadata, tốc độ tối ưu — lên top tìm kiếm dễ hơn.' },
  { icon: '🔒', title: 'Dữ liệu tách biệt', desc: 'Mỗi nhà xe một không gian dữ liệu riêng, bảo mật, không lẫn lộn.' },
];

const STEPS = [
  { title: 'Đăng ký', desc: 'Liên hệ MKT để được cấp tài khoản và website cho nhà xe của bạn.' },
  { title: 'Tùy chỉnh', desc: 'Đặt logo, màu, hotline, thêm tuyến & tài xế, chọn giao diện — vài phút là xong.' },
  { title: 'Xuất bản', desc: 'Website chạy ngay trên subdomain (hoặc tên miền riêng), bắt đầu nhận khách.' },
];

function PlanCard({ name, highlight, items }: { name: string; highlight?: boolean; items: string[] }) {
  return (
    <div className={`rounded-3xl border p-6 ${highlight ? 'border-indigo-500 bg-white shadow-xl ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white shadow-sm'}`}>
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-xl font-bold text-slate-800">{name}</h3>
        {highlight && <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">Khuyên dùng</span>}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-600">✓</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PlatformLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-heading text-xl font-extrabold text-indigo-700">
            xeghep<span className="text-amber-500">.info</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            <a href="#tinh-nang" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-700">Tính năng</a>
            <a href="#bang-gia" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-700">Bảng giá</a>
            <a href="#quy-trinh" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-700">Quy trình</a>
            <a href="#lien-he" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-700">Liên hệ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/control/login" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block">
              Quản trị
            </Link>
            <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              ☎ {HOTLINE}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 text-white">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/25">
              Nền tảng website xe ghép
            </span>
            <h1 className="mt-5 font-heading text-3xl font-extrabold leading-snug md:text-5xl">
              Website xe ghép thương hiệu riêng cho nhà xe của bạn
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 md:text-lg">
              Tự động có website nhận đặt xe, quản lý tài xế & tuyến đường — chuẩn SEO, đẹp, nhanh. Lên sóng chỉ trong vài phút, không cần biết kỹ thuật.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#lien-he" className="rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg hover:opacity-90">
                Đăng ký / Tư vấn
              </a>
              <a href="#tinh-nang" className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20">
                Xem tính năng
              </a>
            </div>
          </div>
        </section>

        {/* Tính năng */}
        <section id="tinh-nang" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Mọi thứ một nhà xe cần</h2>
              <p className="mt-2 text-slate-500">Tập trung vào chở khách — phần website & vận hành đã có nền tảng lo.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="text-3xl">{f.icon}</div>
                  <div className="mt-3 font-semibold text-slate-800">{f.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bảng giá */}
        <section id="bang-gia" className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Gói dịch vụ</h2>
              <p className="mt-2 text-slate-500">Bắt đầu miễn phí, nâng cấp khi cần thêm sức mạnh.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <PlanCard
                name="Free"
                items={[
                  'Website trên subdomain riêng',
                  'Nhận đặt xe qua Telegram',
                  'Quản lý tuyến, tài xế, chuyến (giới hạn)',
                  '1 giao diện mặc định',
                  'SEO cơ bản',
                ]}
              />
              <PlanCard
                name="Pro"
                highlight
                items={[
                  'Tất cả tính năng Free',
                  'Gắn tên miền riêng + HTTPS tự động',
                  'Không giới hạn tuyến & tài xế',
                  'Chọn nhiều giao diện cao cấp',
                  'Mã giảm giá, báo cáo chi tiết, ẩn “Powered by”',
                  'Cổng tài xế tự đăng chuyến',
                ]}
              />
            </div>
          </div>
        </section>

        {/* Quy trình */}
        <section id="quy-trinh" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl font-bold text-slate-800 md:text-3xl">Lên sóng chỉ với 3 bước</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">{i + 1}</div>
                  <div className="mt-3 font-semibold text-slate-800">{s.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Liên hệ */}
        <section id="lien-he" className="bg-gradient-to-r from-indigo-700 to-blue-600 py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">Sẵn sàng có website cho nhà xe của bạn?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">Liên hệ để được tư vấn và cấp website dùng thử ngay hôm nay.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg hover:opacity-90">
                ☎ Gọi {HOTLINE}
              </a>
              <a href={`mailto:${EMAIL}`} className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20">
                ✉ {EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-sm text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <div className="font-heading text-lg font-extrabold text-white">
            xeghep<span className="text-amber-500">.info</span>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Nền tảng website xe ghép. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
