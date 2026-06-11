/**
 * Kiểu dữ liệu & chuẩn hóa nội dung trang chủ (HomeContent.data — CLAUDE.md Mục 12.A).
 * NỘI DUNG TÁCH KHỎI GIAO DIỆN: mọi theme đọc cùng cấu trúc này; đổi theme không
 * đụng dữ liệu. Parser khoan dung — thiếu field thì điền mặc định để luôn render được.
 */

export type Banner = { imageUrl?: string; title?: string; subtitle?: string; href?: string };
export type WhyItem = { title: string; desc?: string; icon?: string };
export type HowStep = { title: string; desc?: string };
export type FaqItem = { q: string; a: string };

export type AboutSection = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  images: string[];
};

export type HeroStat = { value: string; label: string };

export type HomeContentData = {
  hero: {
    title: string; // có thể nhiều dòng (\n) — theme hiển thị mỗi dòng, dòng cuối tô màu nhấn
    subtitle: string;
    ctaLabel: string;
    ctaSecondaryLabel: string;
    badge: string;
    stats: HeroStat[];
    imageUrl?: string;
  };
  banners: Banner[];
  whyChooseUs: WhyItem[];
  howToBook: HowStep[];
  faq: FaqItem[];
  driverCta: { title: string; desc: string; buttonLabel: string };
  about: AboutSection;
};

const DEFAULTS: HomeContentData = {
  hero: {
    title: 'Đặt xe\nNhanh chóng\nĐón trả tận nơi',
    subtitle: 'Kết nối tài xế đã xác thực — giá minh bạch, đón tận nơi.',
    ctaLabel: 'Đặt xe ngay',
    ctaSecondaryLabel: 'Xem lịch trình',
    badge: 'Xe ghép toàn quốc',
    stats: [
      { value: '600+', label: 'chuyến mỗi ngày' },
      { value: '4.9★', label: 'từ 12.000 đánh giá' },
      { value: '12', label: 'tỉnh thành phủ sóng' },
    ],
  },
  banners: [],
  whyChooseUs: [
    { title: 'Tài xế đã xác thực', desc: 'Hồ sơ CCCD, giấy phép, đăng kiểm được duyệt.' },
    { title: 'Giá minh bạch', desc: 'Báo giá rõ ràng trước khi đặt, không phụ phí ẩn.' },
    { title: 'Đặt chỗ dễ dàng', desc: 'Chọn tuyến, để lại thông tin, được gọi xác nhận ngay.' },
  ],
  howToBook: [
    { title: 'Chọn tuyến', desc: 'Nhập điểm đi, điểm đến và ngày khởi hành.' },
    { title: 'Để lại thông tin', desc: 'Điền họ tên, số điện thoại và số ghế.' },
    { title: 'Nhận xác nhận', desc: 'Tổng đài gọi lại xác nhận chuyến và tài xế.' },
  ],
  faq: [
    { q: 'Tôi có cần đặt cọc không?', a: 'Không. Bạn chỉ thanh toán trực tiếp cho tài xế khi đi.' },
    { q: 'Có đón tận nhà không?', a: 'Có, tài xế đón và trả tận nơi theo thỏa thuận.' },
  ],
  driverCta: {
    title: 'Bạn là tài xế?',
    desc: 'Tham gia đội ngũ để nhận thêm chuyến và khách hàng.',
    buttonLabel: 'Đăng ký tài xế',
  },
  about: {
    eyebrow: 'Về chúng tôi',
    title: 'Nền tảng đặt xe ghép uy tín toàn quốc',
    description:
      'Nền tảng kết nối hành khách với các nhà xe uy tín trên toàn quốc. Giúp bạn đặt xe ghép nhanh chóng, minh bạch và tiện lợi chỉ trong vài phút.',
    bullets: [
      'Đặt xe online 24/7',
      'Đón trả tận nơi',
      'Giá cả rõ ràng, minh bạch',
      'Hàng trăm tuyến xe mỗi ngày',
      'Đội ngũ hỗ trợ chuyên nghiệp',
    ],
    images: [],
  },
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Chuẩn hóa HomeContent.data (Json) về HomeContentData đầy đủ. */
export function parseHomeContent(data: unknown): HomeContentData {
  const d = (data ?? {}) as Record<string, unknown>;
  const hero = (d.hero ?? {}) as Record<string, unknown>;
  const driverCta = (d.driverCta ?? {}) as Record<string, unknown>;
  const about = (d.about ?? {}) as Record<string, unknown>;
  const aboutBullets = asArray<unknown>(about.bullets).filter((b): b is string => typeof b === 'string' && b.length > 0);
  const aboutImages = asArray<unknown>(about.images).filter((s): s is string => typeof s === 'string' && s.length > 0);

  const heroStats = asArray<unknown>(hero.stats)
    .map((s) => s as Record<string, unknown>)
    .map((s) => ({ value: String(s.value ?? ''), label: String(s.label ?? '') }))
    .filter((s) => s.value);

  // whyChooseUs có thể là string[] (seed cũ) hoặc {title,desc}[].
  const whyRaw = asArray<unknown>(d.whyChooseUs);
  const whyChooseUs: WhyItem[] = whyRaw.length
    ? whyRaw.map((w) =>
        typeof w === 'string' ? { title: w } : (w as WhyItem)
      )
    : DEFAULTS.whyChooseUs;

  return {
    hero: {
      title: (hero.title as string) || DEFAULTS.hero.title,
      subtitle: (hero.subtitle as string) || DEFAULTS.hero.subtitle,
      ctaLabel: (hero.ctaLabel as string) || DEFAULTS.hero.ctaLabel,
      ctaSecondaryLabel: (hero.ctaSecondaryLabel as string) || DEFAULTS.hero.ctaSecondaryLabel,
      badge: (hero.badge as string) || DEFAULTS.hero.badge,
      stats: heroStats.length ? heroStats : DEFAULTS.hero.stats,
      imageUrl: (hero.imageUrl as string) || undefined,
    },
    banners: asArray<Banner>(d.banners),
    whyChooseUs,
    howToBook: asArray<HowStep>(d.howToBook).length ? asArray<HowStep>(d.howToBook) : DEFAULTS.howToBook,
    faq: asArray<FaqItem>(d.faq).length ? asArray<FaqItem>(d.faq) : DEFAULTS.faq,
    driverCta: {
      title: (driverCta.title as string) || DEFAULTS.driverCta.title,
      desc: (driverCta.desc as string) || DEFAULTS.driverCta.desc,
      buttonLabel: (driverCta.buttonLabel as string) || DEFAULTS.driverCta.buttonLabel,
    },
    about: {
      eyebrow: (about.eyebrow as string) || DEFAULTS.about.eyebrow,
      title: (about.title as string) || DEFAULTS.about.title,
      description: (about.description as string) || DEFAULTS.about.description,
      bullets: aboutBullets.length ? aboutBullets : DEFAULTS.about.bullets,
      images: aboutImages,
    },
  };
}

export const DEFAULT_HOME_CONTENT = DEFAULTS;
