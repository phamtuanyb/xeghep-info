import { Be_Vietnam_Pro } from 'next/font/google';

// Be Vietnam Pro: font cho cả body/UI lẫn heading (hỗ trợ tiếng Việt có dấu ĐẦY ĐỦ).
// (Trước dùng Sora cho heading nhưng Sora không có glyph tiếng Việt -> vỡ font ở tiêu đề.)
export const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});
