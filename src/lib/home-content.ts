/**
 * Kiểu dữ liệu & chuẩn hóa nội dung trang chủ (HomeContent.data — CLAUDE.md Mục 12.A).
 * NỘI DUNG TÁCH KHỎI GIAO DIỆN: mọi theme đọc cùng cấu trúc này; đổi theme không
 * đụng dữ liệu. Parser khoan dung — thiếu field thì điền mặc định để luôn render được.
 */

export type Banner = { imageUrl?: string; title?: string; subtitle?: string; href?: string };
export type WhyItem = { title: string; desc?: string; icon?: string };
export type HowStep = { title: string; desc?: string };
export type FaqItem = { q: string; a: string };

export type HomeContentData = {
  hero: { title: string; subtitle: string; ctaLabel: string; imageUrl?: string };
  banners: Banner[];
  whyChooseUs: WhyItem[];
  howToBook: HowStep[];
  faq: FaqItem[];
  driverCta: { title: string; desc: string; buttonLabel: string };
};

const DEFAULTS: HomeContentData = {
  hero: {
    title: 'Đặt xe ghép nhanh chóng, an toàn',
    subtitle: 'Kết nối tài xế đã xác thực — giá minh bạch, đón tận nơi.',
    ctaLabel: 'Tìm chuyến ngay',
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
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Chuẩn hóa HomeContent.data (Json) về HomeContentData đầy đủ. */
export function parseHomeContent(data: unknown): HomeContentData {
  const d = (data ?? {}) as Record<string, unknown>;
  const hero = (d.hero ?? {}) as Record<string, unknown>;
  const driverCta = (d.driverCta ?? {}) as Record<string, unknown>;

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
  };
}

export const DEFAULT_HOME_CONTENT = DEFAULTS;
