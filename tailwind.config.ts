import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/themes/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Be Vietnam Pro cho cả body/UI lẫn heading — hỗ trợ tiếng Việt có dấu ĐẦY ĐỦ.
        // (Trước dùng Sora cho heading nhưng Sora không có glyph tiếng Việt -> vỡ font.)
        sans: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1565C0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
