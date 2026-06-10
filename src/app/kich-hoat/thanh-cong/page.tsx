/**
 * Màn xác nhận kích hoạt thành công. Hướng dẫn chủ xe đăng nhập vào subdomain mới để
 * vào wizard khởi tạo (M4).
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kích hoạt thành công' };

export default function RedeemSuccessPage({ searchParams }: { searchParams: { slug?: string } }) {
  const rootDomain = process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn';
  const slug = searchParams.slug ?? '';
  const adminUrl = slug ? `https://${slug}.${rootDomain}/admin` : '#';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="font-heading text-2xl font-bold text-slate-800">Tạo website thành công!</h1>
        <p className="mt-2 text-slate-500">
          Website của bạn đã sẵn sàng tại{' '}
          <span className="font-semibold text-slate-700">{slug}.{rootDomain}</span>.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Đăng nhập bằng email &amp; mật khẩu vừa tạo để hoàn tất thiết lập (chọn giao diện, thêm tuyến) rồi xuất bản.
        </p>
        <a
          href={adminUrl}
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Vào trang quản trị
        </a>
      </div>
    </main>
  );
}
