/**
 * Cấu hình (CLAUDE.md Mục 12.B & 13): Telegram Bot (token/chat id/gửi thử) + SEO/GA4/
 * Search Console. Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { Card, FlashOk, FlashError } from '@/components/admin/ui';
import { updateTelegramAction, testTelegramAction, updateSeoAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: { telegram?: string } }) {
  return renderAdmin(async () => {
    const setting = await db.tenantSetting.findFirst();

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Cấu hình</h1>

        {searchParams.telegram === 'ok' && <FlashOk message="Gửi thử Telegram thành công!" />}
        {searchParams.telegram === 'fail' && <FlashError message="Gửi thử Telegram thất bại. Kiểm tra token và chat id." />}

        <Card title="Telegram Bot (nhận lead/đặt xe)">
          <form className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="telegramEnabled" defaultChecked={setting?.telegramEnabled ?? false} className="h-4 w-4" /> Bật gửi thông báo Telegram
            </label>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Bot Token</label>
              <input name="telegramToken" defaultValue={setting?.telegramToken ?? ''} placeholder="123456:ABC..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Chat ID</label>
              <input name="telegramChatId" defaultValue={setting?.telegramChatId ?? ''} placeholder="-1001234567890" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button formAction={updateTelegramAction} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu cấu hình</button>
              <button formAction={testTelegramAction} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Gửi thử</button>
            </div>
          </form>
        </Card>

        <Card title="SEO / GA4 / Search Console">
          <form action={updateSeoAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tiêu đề SEO</label>
              <input name="seoTitle" defaultValue={setting?.seoTitle ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Mô tả SEO</label>
              <textarea name="seoDescription" rows={2} defaultValue={setting?.seoDescription ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Từ khóa</label>
                <input name="seoKeywords" defaultValue={setting?.seoKeywords ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">GA4 Measurement ID</label>
                <input name="ga4Id" defaultValue={setting?.ga4Id ?? ''} placeholder="G-XXXXXXX" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Search Console</label>
                <input name="searchConsoleId" defaultValue={setting?.searchConsoleId ?? ''} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="allowIndex" defaultChecked={setting?.allowIndex ?? true} className="h-4 w-4" /> Cho phép công cụ tìm kiếm lập chỉ mục
            </label>
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Lưu SEO</button>
          </form>
        </Card>
      </div>
    );
  }, { adminOnly: true });
}
