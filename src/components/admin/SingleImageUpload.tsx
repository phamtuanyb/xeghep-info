'use client';

/**
 * Tải LÊN MỘT ảnh từ máy, lưu URL vào input ẩn để form gửi đi. Có xem trước + xóa.
 * Dùng cho ảnh "Mẫu giao diện" trong Control Plane (endpoint /api/control/upload).
 */
import { useRef, useState } from 'react';

export default function SingleImageUpload({
  name,
  defaultValue = '',
  endpoint = '/api/admin/upload',
  label = 'Ảnh',
}: {
  name: string;
  defaultValue?: string;
  endpoint?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setUrl(data.url);
      else setError(data.error || 'Tải ảnh thất bại.');
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-3">
        {url ? (
          <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Xem trước" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              aria-label="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
            Chưa có ảnh
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50 disabled:opacity-60"
        >
          {busy ? 'Đang tải…' : '📁 Tải ảnh lên'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
