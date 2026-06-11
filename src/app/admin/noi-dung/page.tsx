/**
 * CMS trang chủ (CLAUDE.md Mục 12.B): sửa toàn bộ thành phần HomeContent.
 * Nội dung tách khỏi giao diện — lưu vào HomeContent.data (Json). Chỉ Quản trị.
 */
import { db } from '@/lib/db';
import { renderAdmin } from '@/lib/admin-render';
import { parseHomeContent } from '@/lib/home-content';
import { Card, FlashOk } from '@/components/admin/ui';
import ImageUploader from '@/components/admin/ImageUploader';
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
              <Field name="hero_badge" label="Nhãn nhỏ phía trên (badge)" defaultValue={c.hero.badge} />
              <div>
                <label className="mb-1 block text-xs text-slate-500">Tiêu đề lớn (mỗi dòng một dòng — dòng cuối tô màu nhấn)</label>
                <textarea
                  name="hero_title"
                  rows={3}
                  defaultValue={c.hero.title}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <Field name="hero_subtitle" label="Mô tả ngắn" defaultValue={c.hero.subtitle} />
              <div className="grid gap-3 md:grid-cols-2">
                <Field name="hero_cta" label="Nút chính" defaultValue={c.hero.ctaLabel} />
                <Field name="hero_cta2" label="Nút phụ" defaultValue={c.hero.ctaSecondaryLabel} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">Số liệu nổi bật (3 ô)</label>
                <div className="grid gap-3 md:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-slate-100 p-3">
                      <Field name={`hero_stat_value_${i}`} label={`Số liệu ${i + 1}`} defaultValue={c.hero.stats[i]?.value ?? ''} />
                      <Field name={`hero_stat_label_${i}`} label="Mô tả" defaultValue={c.hero.stats[i]?.label ?? ''} />
                    </div>
                  ))}
                </div>
              </div>

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

          <Card title="Về chúng tôi (khối giới thiệu)">
            <div className="grid gap-3">
              <Field name="about_eyebrow" label="Nhãn nhỏ phía trên" defaultValue={c.about.eyebrow} />
              <Field name="about_title" label="Tiêu đề" defaultValue={c.about.title} />
              <div>
                <label className="mb-1 block text-xs text-slate-500">Mô tả</label>
                <textarea
                  name="about_description"
                  rows={3}
                  defaultValue={c.about.description}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Danh sách điểm nổi bật (mỗi dòng một ý)</label>
                <textarea
                  name="about_bullets"
                  rows={5}
                  defaultValue={c.about.bullets.join('\n')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <ImageUploader name="about_images" initial={c.about.images} label="Ảnh minh họa (nhiều ảnh — tự xoay vòng)" />
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
