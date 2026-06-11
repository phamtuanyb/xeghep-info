'use client';

/**
 * Quản lý nhiều ảnh trong form CMS (Tenant Admin): tải ảnh từ máy (POST /api/admin/upload)
 * hoặc dán URL. Lưu danh sách URL vào 1 input ẩn (mỗi dòng 1 URL) để server action đọc.
 * Không chứa logic dữ liệu — chỉ thu thập URL ảnh.
 */
import { useRef, useState } from 'react';

export default function ImageUploader({
  name,
  initial = [],
  label = 'Ảnh',
}: {
  name: string;
  initial?: string[];
  label?: string;
}) {
  const [images, setImages] = useState<string[]>(initial);
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function remove(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function addUrl() {
    const u = urlInput.trim();
    if (u) {
      setImages((prev) => [...prev, u]);
      setUrlInput('');
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (res.ok && data.url) added.push(data.url);
        else setError(data.error || 'Tải ảnh thất bại.');
      } catch {
        setError('Không kết nối được máy chủ khi tải ảnh.');
      }
    }
    if (added.length) setImages((prev) => [...prev, ...added]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>

      {/* Danh sách ảnh hiện có */}
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tải từ máy + thêm URL */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50 disabled:opacity-60"
        >
          {busy ? 'Đang tải…' : '📁 Tải ảnh từ máy'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />

        <div className="flex flex-1 items-center gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="hoặc dán URL ảnh…"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button type="button" onClick={addUrl} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Thêm URL
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-slate-400">Tải ảnh từ máy (tối đa 8MB/ảnh, tự tối ưu) hoặc dán URL. Có thể thêm nhiều ảnh.</p>

      {/* Giá trị gửi lên server: mỗi dòng 1 URL */}
      <input type="hidden" name={name} value={images.join('\n')} />
    </div>
  );
}
