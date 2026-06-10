/**
 * CMS trang chủ (CLAUDE.md Mục 12.B): sửa toàn bộ thành phần HomeContent.
 * Nội dung tách khỏi giao diện — lưu vào HomeContent.data (Json). Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { parseHomeContent } from '@/lib/home-content';
import { Card, FlashOk } from '@/components/admin/ui';
import { updateHomeContentAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function HomeCmsPage({ searchParams }: { searchParams: { saved?: string } }) {
  return renderAdmin(async () => {
    const row = await db.homeContent.findFirst();
    const c = parseHomeContent(row?.data);
    const bannerText = c.banners.map((b) => `${b.imageUrl ?? ''} :: ${b.title ?? ''} :: ${b.subtitle ?? ''}`).join('\n');

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">CMS trang chủ</h1>
        <FlashOk message={searchParams.saved ? 'Đã lưu nội dung trang chủ.' : undefined} />

        <form action={updateHomeContentAction} className="space-y-6">
          <Card title="Hero (khối đầu trang)">
            <div className="grid gap-3">
              <Field name="hero_title" label="Tiêu đề" defaultValue={c.hero.title} />
              <Field name="hero_subtitle" label="Mô tả" defaultValue={c.hero.subtitle} />
              <Field name="hero_cta" label="Nhãn nút" defaultValue={c.hero.ctaLabel} />
              <Field
                name="hero_image"
                label="Ảnh nền hero (URL) — để trống sẽ dùng nền tối mặc định"
                defaultValue={c.hero.imageUrl ?? ''}
              />
              {c.hero.imageUrl && (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.hero.imageUrl} alt="Xem trước ảnh nền hero" className="h-32 w-full object-cover" />
                </div>
              )}
            </div>
          </Card>

          <Card title="Ảnh nền hero / Banner slideshow (mỗi dòng: URL ảnh :: Tiêu đề :: Mô tả)">
            <textarea
              name="banners"
              rows={4}
              defaultValue={bannerText}
              placeholder="https://.../anh1.jpg :: Tiêu đề :: Mô tả"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-400">
              Mỗi dòng là một ảnh nền hero. Nhiều dòng → ảnh tự xoay vòng (slideshow). Tiêu đề và Mô tả có thể để trống.
            </p>
          </Card>

          <Card title="Vì sao chọn chúng tôi (3 mục)">
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Field name={`why_title_${i}`} label={`Mục ${i + 1} — tiêu đề`} defaultValue={c.whyChooseUs[i]?.title ?? ''} />
                  <Field name={`why_desc_${i}`} label="Mô tả" defaultValue={c.whyChooseUs[i]?.desc ?? ''} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Cách đặt xe (3 bước)">
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Field name={`how_title_${i}`} label={`Bước ${i + 1} — tiêu đề`} defaultValue={c.howToBook[i]?.title ?? ''} />
                  <Field name={`how_desc_${i}`} label="Mô tả" defaultValue={c.howToBook[i]?.desc ?? ''} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Câu hỏi thường gặp (3 mục)">
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Field name={`faq_q_${i}`} label={`Câu hỏi ${i + 1}`} defaultValue={c.faq[i]?.q ?? ''} />
                  <Field name={`faq_a_${i}`} label="Trả lời" defaultValue={c.faq[i]?.a ?? ''} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="CTA tài xế">
            <div className="grid gap-3 md:grid-cols-3">
              <Field name="cta_title" label="Tiêu đề" defaultValue={c.driverCta.title} />
              <Field name="cta_desc" label="Mô tả" defaultValue={c.driverCta.desc} />
              <Field name="cta_button" label="Nhãn nút" defaultValue={c.driverCta.buttonLabel} />
            </div>
          </Card>

          <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Lưu nội dung</button>
        </form>
      </div>
    );
  }, { adminOnly: true });
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
