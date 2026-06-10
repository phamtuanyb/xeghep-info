'use client';

/**
 * Nền hero dạng slideshow: xoay vòng nhiều ảnh banner làm ảnh nền full-bleed.
 * Nhận danh sách URL ảnh (đã tách khỏi giao diện — từ HomeContent.banners). Tự xoay
 * mỗi 5s, fade chuyển ảnh. Dùng chung cho mọi theme qua <HeroBackdrop> trong shared.
 */
import { useEffect, useState } from 'react';

export default function HeroSlideshowBg({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  return (
    <>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          aria-hidden
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </>
  );
}
