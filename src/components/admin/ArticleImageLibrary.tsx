'use client';

/**
 * Kho ảnh bài viết của website hiện tại (Tenant Admin). Admin tải ảnh lên thư mục riêng
 * của site (public/article-images/<tenantId>/). Khi đăng/import bài, hệ thống tự lấy
 * ngẫu nhiên từ chính kho này. Không tied vào form — thao tác trực tiếp qua API.
 */
import { useEffect, useRef, useState } from 'react';

export default function ArticleImageLibrary() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const res = await fetch('/api/admin/article-images');
      const data = (await res.json()) as { images?: string[] };
      setImages(data.images ?? []);
    } catch {
      setError('Không tải được danh sách ảnh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/article-images', { method: 'POST', body: fd });
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          setError(d.error || 'Tải ảnh thất bại.');
        }
      } catch {
        setError('Không kết nối được máy chủ khi tải ảnh.');
      }
    }
    if (fileRef.current) fileRef.current.value = '';
    await refresh();
    setBusy(false);
  }

  async function remove(url: string) {
    setBusy(true);
    try {
      await fetch('/api/admin/article-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      /* bỏ qua */
    }
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Đang tải…' : '📁 Tải ảnh lên kho'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <span className="text-sm text-slate-500">{loading ? 'Đang tải…' : `${images.length} ảnh trong kho của site này`}</span>
      </div>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((src) => (
            <div key={src} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Ảnh kho bài viết" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(src)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-sm text-slate-400">Kho ảnh trống. Tải ảnh lên để hệ thống tự chèn vào bài viết.</p>
      )}

      <p className="mt-2 text-xs text-slate-400">
        Khi đăng/import bài, hệ thống tự lấy ngẫu nhiên <strong>1 ảnh bìa + 1 ảnh trong bài</strong> từ kho này (riêng của
        website bạn). Ảnh tối đa 8MB/tệp, tự tối ưu.
      </p>
    </div>
  );
}
