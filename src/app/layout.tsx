import type { Metadata } from 'next';
import { beVietnamPro } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nền tảng website xe ghép',
  description: 'Nền tảng website xe ghép white-label, đa người thuê.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body>{children}</body>
    </html>
  );
}
