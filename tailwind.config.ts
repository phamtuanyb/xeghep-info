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
        // Be Vietnam Pro: body/UI; Sora: heading. Khai báo qua CSS variable từ next/font.
        sans: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sora)', 'var(--font-be-vietnam-pro)', 'sans-serif'],
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
