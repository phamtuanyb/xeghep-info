/**
 * Cài đặt nền tảng (Control Plane) — CLAUDE.md Mục 12.D.
 * Hiện cấu hình Telegram nhận LEAD từ trang giới thiệu gốc xeghep.info. Chỉ SUPER_ADMIN.
 */
import { dbAdmin } from '@/lib/db';
import { saveTelegramSettingsAction, testTelegramAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function ControlSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; test?: string };
}) {
  const setting = await dbAdmin.platformSetting.findUnique({ where: { id: 'platform' } });
  const hasToken = !!setting?.telegramBotToken;
  const hasChatId = !!setting?.telegramChatId;
  const ready = hasToken && hasChatId;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Cài đặt nền tảng</h1>
      <p className="text-sm text-slate-500">
        Cấu hình các tích hợp cấp nền tảng (áp dụng cho trang giới thiệu gốc <strong>xeghep.info</strong>).
      </p>

      {searchParams.saved && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          ✅ Đã lưu cài đặt.
        </p>
      )}
      {searchParams.test === 'ok' && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          ✅ Đã gửi tin thử — kiểm tra Telegram của bạn.
        </p>
      )}
      {searchParams.test === 'unconfigured' && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
          ⚠️ Chưa cấu hình token và chat id.
        </p>
      )}
      {searchParams.test === 'fail' && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-200">
          ❌ Gửi thất bại. Kiểm tra lại token / chat id (bot đã được thêm vào group chưa?).
        </p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Telegram nhận lead (trang gốc xeghep.info)</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ready ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {ready ? '✓ Đã sẵn sàng' : 'Chưa cấu hình'}
          </span>
        </div>

        <form action={saveTelegramSettingsAction} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bot Token</label>
            <input
              name="telegramBotToken"
              type="password"
              autoComplete="off"
              placeholder={hasToken ? '•••••• (đã lưu — để trống nếu giữ nguyên)' : 'VD: 123456789:ABCdef...'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">Lấy từ @BotFather. Để trống khi lưu = giữ token cũ.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Chat ID nhận lead</label>
            <input
              name="telegramChatId"
              defaultValue={setting?.telegramChatId ?? ''}
              placeholder="VD: -1001234567890 (group thường là số âm)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Lưu cài đặt
            </button>
          </div>
        </form>

        <form action={testTelegramAction} className="mt-3 border-t border-slate-100 pt-4">
          <button className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50">
            Gửi tin thử
          </button>
          <span className="ml-3 text-xs text-slate-400">Gửi 1 tin mẫu về group để kiểm tra.</span>
        </form>
      </section>

      <section className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
        <h3 className="mb-2 font-semibold text-slate-700">Hướng dẫn lấy Token & Chat ID</h3>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Nhắn <strong>@BotFather</strong> trên Telegram → <code>/newbot</code> → nhận <strong>Bot Token</strong>.</li>
          <li>Tạo 1 group nhận lead, <strong>thêm bot vào group</strong>, gửi 1 tin bất kỳ trong group.</li>
          <li>
            Mở <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> → tìm <code>&quot;chat&quot;:{'{'}&quot;id&quot;:-100...{'}'}</code> →
            đó là <strong>Chat ID</strong>.
          </li>
          <li>Điền 2 ô trên → <strong>Lưu</strong> → bấm <strong>Gửi tin thử</strong> để kiểm tra.</li>
        </ol>
      </section>
    </div>
  );
}
