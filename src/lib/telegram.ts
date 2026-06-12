/**
 * Telegram Bot API (CLAUDE.md Mục 13) — gửi lead/đặt xe về group của tenant.
 * Cấu hình per-tenant trong TenantSetting; token mặc định nền tảng lấy từ env.
 * Nếu chưa cấu hình -> bỏ qua (không ném lỗi, không chặn luồng đặt xe).
 *
 * PHẢI gọi trong tenant context (đọc TenantSetting qua db cô lập).
 */
import { db, dbAdmin } from './db';

/** Lấy cấu hình Telegram cấp nền tảng: ưu tiên DB (PlatformSetting), fallback env. */
async function getPlatformTelegram(): Promise<{ token: string | null; chatId: string | null }> {
  let token = process.env.TELEGRAM_BOT_TOKEN || null;
  let chatId = process.env.PLATFORM_TELEGRAM_CHAT_ID || null;
  try {
    const s = await dbAdmin.platformSetting.findUnique({ where: { id: 'platform' } });
    if (s?.telegramBotToken) token = s.telegramBotToken;
    if (s?.telegramChatId) chatId = s.telegramChatId;
  } catch {
    /* DB lỗi -> dùng env */
  }
  return { token, chatId };
}

type LeadInfo = {
  brandName: string;
  customerName: string;
  customerPhone: string;
  fromName?: string | null; // điểm đón
  toName?: string | null; // nơi trả khách
  departDate?: string | null; // ngày đi (yyyy-mm-dd)
  seats?: number;
  serviceType?: string | null;
  note?: string | null;
  ip?: string | null;
  device?: string | null;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMessage(lead: LeadInfo): string {
  const lines = [
    `🚖 <b>Đặt xe mới — ${escapeHtml(lead.brandName)}</b>`,
    `👤 Khách: ${escapeHtml(lead.customerName)}`,
    `📞 SĐT: ${escapeHtml(lead.customerPhone)}`,
  ];
  if (lead.fromName) lines.push(`📍 Điểm đón: ${escapeHtml(lead.fromName)}`);
  if (lead.toName) lines.push(`🏁 Trả khách: ${escapeHtml(lead.toName)}`);
  if (lead.departDate) lines.push(`📅 Ngày đi: ${escapeHtml(lead.departDate)}`);
  if (lead.seats) lines.push(`💺 Số ghế: ${lead.seats}`);
  if (lead.serviceType) lines.push(`🚙 Dịch vụ: ${escapeHtml(lead.serviceType)}`);
  if (lead.note) lines.push(`📝 Ghi chú: ${escapeHtml(lead.note)}`);
  if (lead.ip) lines.push(`🌐 IP: ${escapeHtml(lead.ip)}`);
  if (lead.device) lines.push(`📱 Thiết bị: ${escapeHtml(lead.device)}`);
  return lines.join('\n');
}

/**
 * Gửi thông báo lead về Telegram của tenant. Trả về true nếu đã gửi.
 * Không bao giờ ném lỗi ra ngoài (chống làm hỏng luồng đặt xe).
 */
export async function sendLeadNotification(lead: LeadInfo): Promise<boolean> {
  try {
    const setting = await db.tenantSetting.findFirst();
    if (!setting || !setting.telegramEnabled) return false;

    const token = setting.telegramToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = setting.telegramChatId;
    if (!token || !chatId) return false;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: buildMessage(lead), parse_mode: 'HTML' }),
      // Không để fetch treo lâu làm chậm phản hồi cho khách.
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type PlatformLead = {
  name: string;
  phone: string;
  route?: string | null;
  ip?: string | null;
  device?: string | null;
};

/**
 * Gửi lead từ trang giới thiệu NỀN TẢNG (xeghep.info) về Telegram của MKT.
 * Cấu hình lấy từ Control Plane (PlatformSetting) hoặc env (cấp nền tảng, KHÔNG theo tenant).
 * Trả về:
 *   - true  : đã gửi
 *   - false : gửi thất bại
 *   - 'unconfigured' : chưa cấu hình token/chat id
 */
export async function sendPlatformLead(lead: PlatformLead): Promise<boolean | 'unconfigured'> {
  const { token, chatId } = await getPlatformTelegram();
  if (!token || !chatId) return 'unconfigured';

  const lines = [
    '🌐 <b>Lead mới — xeghep.info</b>',
    `👤 Họ tên: ${escapeHtml(lead.name)}`,
    `📞 SĐT/Zalo: ${escapeHtml(lead.phone)}`,
  ];
  if (lead.route) lines.push(`🚌 Tuyến: ${escapeHtml(lead.route)}`);
  if (lead.ip) lines.push(`🌐 IP: ${escapeHtml(lead.ip)}`);
  if (lead.device) lines.push(`📱 Thiết bị: ${escapeHtml(lead.device)}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
