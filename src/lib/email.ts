/**
 * Gửi email (CLAUDE.md Mục 13) — đặt lại mật khẩu khách. Dùng Resend nếu có
 * RESEND_API_KEY; nếu không (môi trường dev) -> ghi log link ra console để thử.
 * Không ném lỗi ra ngoài luồng.
 */
type SendEmailInput = { to: string; subject: string; html: string; text?: string };

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback: không có nhà cung cấp email -> log để lập trình viên thử luồng.
    // KHÔNG dùng ở production (Mục 5 yêu cầu cấu hình email thật).
    console.info(`[email:dev] gửi tới ${input.to} — ${input.subject}\n${input.text ?? input.html}`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'no-reply@xeghep-mkt.vn',
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
