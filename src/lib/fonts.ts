import { Be_Vietnam_Pro, Sora } from 'next/font/google';

// Be Vietnam Pro: font chính cho body/UI (hỗ trợ tiếng Việt có dấu đầy đủ).
export const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

// Sora: font cho heading.
export const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});
