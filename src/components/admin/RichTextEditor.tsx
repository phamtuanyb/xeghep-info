'use client';

/**
 * Trình soạn thảo có định dạng cho bài viết (Tenant Admin) — thay textarea HTML thô.
 * Hỗ trợ in đậm/nghiêng/gạch chân, tiêu đề, danh sách, và CHÈN LINK theo URL admin nhập
 * (mỗi website chủ động gắn URL riêng). HTML được lưu vào input ẩn -> server sanitize.
 *
 * Dùng document.execCommand (đủ cho công cụ soạn thảo nội bộ, không thêm thư viện nặng).
 */
import { useEffect, useRef, useState } from 'react';

export default function RichTextEditor({ name, defaultValue = '' }: { name: string; defaultValue?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  // Nạp nội dung ban đầu MỘT lần (không bind innerHTML qua state để khỏi nhảy con trỏ).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = defaultValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    if (ref.current) setHtml(ref.current.innerHTML);
  }

  function exec(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  }

  function addLink() {
    const sel = window.getSelection();
    const hasSelection = !!sel && sel.toString().trim().length > 0;
    const url = window.prompt('Nhập URL liên kết (vd: https://… hoặc /tintuc/bai-viet):', 'https://');
    if (!url) return;
    ref.current?.focus();
    if (hasSelection) {
      document.execCommand('createLink', false, url);
    } else {
      const safe = url.replace(/"/g, '&quot;');
      document.execCommand('insertHTML', false, `<a href="${safe}">${url}</a>`);
    }
    sync();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 p-1.5">
        <TBtn onClick={() => exec('bold')}><b>B</b></TBtn>
        <TBtn onClick={() => exec('italic')}><i>I</i></TBtn>
        <TBtn onClick={() => exec('underline')}><u>U</u></TBtn>
        <span className="mx-1 w-px self-stretch bg-slate-200" />
        <TBtn onClick={() => exec('formatBlock', 'h2')}>H2</TBtn>
        <TBtn onClick={() => exec('formatBlock', 'h3')}>H3</TBtn>
        <TBtn onClick={() => exec('formatBlock', 'p')}>Đoạn</TBtn>
        <span className="mx-1 w-px self-stretch bg-slate-200" />
        <TBtn onClick={() => exec('insertUnorderedList')}>• Danh sách</TBtn>
        <TBtn onClick={() => exec('insertOrderedList')}>1. Đánh số</TBtn>
        <span className="mx-1 w-px self-stretch bg-slate-200" />
        <TBtn onClick={addLink}>🔗 Chèn link</TBtn>
        <TBtn onClick={() => exec('unlink')}>Bỏ link</TBtn>
        <TBtn onClick={() => exec('removeFormat')}>Xóa định dạng</TBtn>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        className="min-h-[200px] overflow-x-auto rounded-b-lg border border-slate-200 px-3 py-2 text-sm leading-7 focus:border-brand focus:outline-none [&_a]:text-brand [&_a]:underline [&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-1.5 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-1.5 [&_ul]:list-disc [&_ul]:pl-5"
      />

      {/* Giá trị gửi lên server (sẽ được sanitize) */}
      <input type="hidden" name={name} value={html} />
      <p className="mt-1 text-xs text-slate-400">
        Bôi đen chữ rồi bấm <strong>🔗 Chèn link</strong> để gắn liên kết theo URL bạn nhập (mỗi website tự dán URL riêng).
      </p>
    </div>
  );
}

function TBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      // Giữ vùng chọn trong editor khi bấm nút (không để mất focus/selection).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
    >
      {children}
    </button>
  );
}
