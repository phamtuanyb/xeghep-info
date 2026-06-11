'use client';

/**
 * Slideshow ảnh "gói gọn" trong một khung (khác HeroSlideshowBg là nền full-bleed).
 * Xoay vòng nhiều ảnh, fade chuyển. Dùng cho khối ảnh minh họa (vd section "Về chúng tôi").
 * className PHẢI có chiều cao (vd h-[360px]) vì các ảnh xếp absolute.
 */
import { useEffect, useState } from 'react';

export default function ImageSlideshow({ images, className }: { images: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 4000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
