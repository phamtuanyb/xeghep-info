/** Thành phần UI dùng chung trong Tenant Admin. */

export function AdminInput({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}

export function DeleteButton({ action, id, label = 'Xóa' }: { action: (fd: FormData) => Promise<void>; id: string; label?: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">{label}</button>
    </form>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      {title && <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>}
      {children}
    </section>
  );
}

export function FlashError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>;
}

export function FlashOk({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>;
}
