/**
 * Trang kích hoạt website bằng mã (CLAUDE.md Mục 14 PHA 2). Khách mua MKT nhập mã +
 * thông tin -> tự tạo tenant + subdomain. Trang cấp nền tảng, không cần tenant context.
 */
import { redeemAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kích hoạt website xe ghép' };

export default function RedeemPage({ searchParams }: { searchParams: { error?: string; code?: string } }) {
  const rootDomain = process.env.ROOT_DOMAIN ?? 'xeghep-mkt.vn';

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-slate-800">Kích hoạt website xe ghép</h1>
          <p className="mt-2 text-slate-500">Nhập mã kích hoạt bạn nhận được khi mua phần mềm MKT để tạo website riêng.</p>
        </div>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
        )}

        <form action={redeemAction} className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <Field name="code" label="Mã kích hoạt *" required placeholder="XXXX-XXXX-XXXX" defaultValue={searchParams.code ?? ''} mono />
          <Field name="brandName" label="Tên thương hiệu *" required placeholder="Nhà xe An Bình" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subdomain *</label>
            <div className="flex items-center">
              <input name="slug" required placeholder="nha-xe-an-binh" className="w-full rounded-l-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">.{rootDomain}</span>
            </div>
          </div>
          <Field name="ownerName" label="Tên chủ xe" placeholder="Nguyễn Văn A" />
          <Field name="ownerEmail" label="Email đăng nhập *" type="email" required placeholder="chuxe@email.vn" />
          <Field name="ownerPassword" label="Mật khẩu *" type="password" required placeholder="tối thiểu 6 ký tự" />
          <button className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
            Tạo website của tôi
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  defaultValue,
  mono,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none ${mono ? 'font-mono uppercase' : ''}`}
      />
    </div>
  );
}
