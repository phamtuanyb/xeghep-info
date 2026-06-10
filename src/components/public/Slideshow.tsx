'use client';

/**
 * Banner slideshow trang chủ (CLAUDE.md Mục 12.A). Tự xoay vòng. Nhận dữ liệu banner
 * (đã serialize) từ HomeContent — không chứa logic dữ liệu.
 */
import { useEffect, useState } from 'react';
import type { Banner } from '@/lib/home-content';

export default function Slideshow({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  const current = banners[index]!;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900">
      {current.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.imageUrl} alt={current.title ?? 'Banner'} className="h-56 w-full object-cover opacity-80 md:h-80" />
      ) : (
        <div className="h-56 w-full bg-gradient-to-r from-[var(--brand)] to-slate-800 md:h-80" />
      )}
      <div className="absolute inset-0 flex flex-col items-start justify-end p-6 text-white md:p-10">
        {current.title && <h3 className="font-heading text-2xl font-bold md:text-4xl">{current.title}</h3>}
        {current.subtitle && <p className="mt-2 max-w-lg text-sm text-white/90 md:text-base">{current.subtitle}</p>}
      </div>
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
