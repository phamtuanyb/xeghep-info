# AGENTS.md — Nền tảng Website Xe Ghép (White-label Multi-tenant SaaS)

> **Tài liệu hướng dẫn build cho Codex.** File này là nguồn chân lý (single source of truth) để AI code toàn bộ hệ thống đúng theo PRD. Mọi quyết định kỹ thuật mâu thuẫn với file này đều SAI.
>
> Sản phẩm: nền tảng website xe ghép, white-label, đa người thuê (multi-tenant). MKT cấp website cho khách mua phần mềm MKT (người làm nghề xe ghép). Mỗi khách = 1 người thuê (tenant), có 1 website thương hiệu riêng.

---

## 0. Cách dùng file này với Codex

1. Đặt file này tên `AGENTS.md` ở **gốc repository**. Codex tự đọc khi mở session trong thư mục dự án.
2. Khi dự án lớn lên, tách chi tiết ra `.Codex/rules/*.md` và import vào đây bằng cú pháp `@path/to/file.md`. Ví dụ: `@.Codex/rules/multi-tenant.md`.
3. **Build theo từng Pha và từng Module (Mục 14)**, không làm nhảy cóc. Mỗi Module xong phải đạt "Definition of Done" trước khi sang Module sau.
4. **Cổng kiểm thử bắt buộc:** không được merge bất kỳ thay đổi nào liên quan tới dữ liệu nếu bộ kiểm thử cô lập người thuê (Mục 15) chưa PASS.
5. Khi cần làm rõ yêu cầu nghiệp vụ, đọc lại `PRD-Website-Xe-Ghep.docx` (tài liệu nghiệp vụ gốc). File `AGENTS.md` này là bản dịch PRD sang hướng dẫn code.

---

## 1. NGUYÊN TẮC BẤT BIẾN (đọc kỹ trước khi code — vi phạm = lỗi nghiêm trọng)

1. **CÔ LẬP NGƯỜI THUÊ (tenant isolation) là ưu tiên số 1.** Mọi truy vấn dữ liệu nghiệp vụ PHẢI lọc theo `tenantId`. Tuyệt đối không để dữ liệu của tenant này lọt sang tenant khác. Việc lọc `tenantId` phải nằm ở **tầng dữ liệu chung** (Prisma Client extension / middleware), KHÔNG phụ thuộc lập trình viên nhớ thêm điều kiện ở từng query. Xem Mục 8.
2. **TOÀN BỘ TEXT HIỂN THỊ RA NGƯỜI DÙNG PHẢI LÀ TIẾNG VIỆT CÓ DẤU.** Menu, nút, nhãn, thông báo lỗi, placeholder, email — tất cả tiếng Việt. Chỉ định danh trong code (biến, hàm, route, DB field) dùng tiếng Anh.
3. **TÁCH NỘI DUNG KHỎI GIAO DIỆN.** Nội dung là dữ liệu trong DB; giao diện (theme) chỉ là tầng hiển thị. Đổi theme KHÔNG được làm mất hay sửa dữ liệu nội dung.
4. **PHÂN QUYỀN THEO GÓI (entitlement) ở SERVER.** Mọi giới hạn Free/Pro phải kiểm tra ở server (API/route handler), không chỉ ẩn nút ở client. Client có thể bị bypass.
5. **BẢO MẬT MẶC ĐỊNH.** JWT trong cookie `httpOnly` + `secure` (prod) + `sameSite`; mật khẩu băm `bcrypt`; sanitize mọi HTML do người dùng nhập (kể cả nội dung import từ Word) trước khi lưu; che dữ liệu nhạy cảm (SĐT, biển số) ở khu công khai; rate-limit thao tác nhạy cảm.
6. **KHÔNG tích hợp cổng thanh toán online.** Sản phẩm này không có thanh toán online. Phí gói Pro thu thủ công, vận hành trong Control Plane. (Quyết định sản phẩm — đừng tự thêm.)
7. **Mọi ràng buộc UNIQUE phải kèm `tenantId`.** Ví dụ slug tuyến `@@unique([tenantId, slug])` — hai tenant khác nhau được phép trùng slug.

---

## 2. Tech stack (cố định, không tự đổi)

- **Next.js 14+ (App Router)** + **TypeScript** (strict mode).
- **Tailwind CSS** cho giao diện. Font: **Be Vietnam Pro** + **Sora**.
- **PostgreSQL** + **Prisma ORM**. Migration bằng `prisma migrate`. Có seed dữ liệu mẫu.
- **JWT** (cookie `httpOnly`) cho auth; **bcrypt** băm mật khẩu.
- **next/image + sharp** tối ưu ảnh.
- **Zod** validate input ở mọi API/route handler.
- Test: **Vitest** (unit) + **Playwright** (e2e), bắt buộc có bộ test cô lập tenant.
- Deploy: VPS (Node) hoặc Vercel + Postgres managed; **PgBouncer** + **Redis** (rate-limit, cache) ở môi trường tải cao.

---

## 3. Kiến trúc tổng thể

### 3.1. Ba lớp — một codebase, một database

| Lớp | Route prefix | Người dùng | Mô tả |
|---|---|---|---|
| **Control Plane** | `/control` | Super Admin (MKT) | Cấp phát & quản lý tenant, gói Free/Pro, kho giao diện |
| **Tenant Admin + Driver** | `/admin`, `/tai-xe` | Chủ xe ghép, Tài xế | Vận hành kinh doanh của từng tenant |
| **Public site** | `/` (theo subdomain tenant) | Khách đi xe | Website công khai theo thương hiệu tenant |

### 3.2. Bốn vai trò (RBAC)

- `SUPER_ADMIN` / `PLATFORM_STAFF` — cấp nền tảng (MKT), KHÔNG gắn `tenantId`.
- `TENANT_ADMIN` — chủ xe ghép, gắn 1 `tenantId`.
- `TENANT_OPERATOR` — điều hành viên của chủ xe (quyền hạn chế), gắn `tenantId`.
- `DRIVER` — tài xế, gắn `tenantId`.
- `CUSTOMER` — khách đi xe (đăng ký bằng email), gắn `tenantId`.

### 3.3. Mô hình multi-tenant: ROW-LEVEL (chung 1 DB)

- Mỗi tenant nhận diện qua **subdomain** (`<slug>.<root-domain>`) hoặc **tên miền riêng** (gói Pro).
- Next.js `middleware.ts` đọc host → tra ra `tenantId` → gắn vào request context (header nội bộ + AsyncLocalStorage).
- Prisma Client extension tự thêm `where: { tenantId }` cho mọi model có cột `tenantId`.
- Control Plane chạy ngoài context tenant (thao tác xuyên tenant, chỉ `SUPER_ADMIN`).

---

## 4. Cấu trúc thư mục (đề xuất)

```
/
├─ AGENTS.md                      # file này
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ middleware.ts               # tenant resolution theo host
│  ├─ lib/
│  │  ├─ db.ts                    # Prisma client + tenant extension
│  │  ├─ tenant-context.ts        # AsyncLocalStorage chứa tenantId hiện tại
│  │  ├─ auth.ts                  # JWT, bcrypt, session
│  │  ├─ rbac.ts                  # kiểm tra vai trò
│  │  ├─ entitlement.ts           # kiểm tra gói Free/Pro
│  │  └─ theme.ts                 # resolve theme theo tenant
│  ├─ app/
│  │  ├─ (public)/                # website công khai theo tenant
│  │  ├─ admin/                   # Tenant Admin
│  │  ├─ tai-xe/                  # cổng tài xế
│  │  ├─ control/                 # Control Plane (Super Admin)
│  │  └─ api/                     # route handlers
│  ├─ themes/                     # các theme: default, theme-a, theme-b...
│  └─ components/
└─ tests/
   ├─ tenant-isolation.spec.ts    # BẮT BUỘC
   └─ entitlement.spec.ts
```

---

## 5. Biến môi trường (.env)

```
DATABASE_URL=postgresql://...
JWT_SECRET=            # >= 32 ký tự, BẮT BUỘC ở production
ROOT_DOMAIN=           # vd: xeghep-mkt.vn (để dựng subdomain)
APP_BASE_URL=
# Tích hợp (cấu hình per-tenant lưu trong DB, không để ở đây nếu là của tenant)
TELEGRAM_BOT_TOKEN=    # mặc định cấp nền tảng; tenant có thể tự nhập token riêng
RESEND_API_KEY=        # gửi email đặt lại mật khẩu (hoặc SMTP)
REDIS_URL=             # rate-limit / cache (tải cao)
```

---

## 6. Mô hình dữ liệu (Prisma schema — bản chuẩn để code)

> Đây là schema khung. Code đúng các quan hệ và cột `tenantId`. Bổ sung field chi tiết khi cần nhưng KHÔNG bỏ `tenantId` ở bảng nghiệp vụ.

```prisma
// ---------- LỚP SaaS (cấp nền tảng) ----------

model Tenant {
  id            String   @id @default(cuid())
  brandName     String                 // tên thương hiệu hiển thị
  slug          String   @unique        // subdomain: <slug>.<ROOT_DOMAIN>
  customDomain  String?  @unique        // tên miền riêng (gói Pro)
  status        TenantStatus @default(PENDING) // PENDING | ACTIVE | LOCKED
  themeId       String?                 // theme đang chọn
  logoUrl       String?
  primaryColor  String?  @default("#1565C0")
  hotline       String?
  createdAt     DateTime @default(now())

  subscription  Subscription?
  theme         Theme?   @relation(fields: [themeId], references: [id])
  // quan hệ ngược tới các bảng nghiệp vụ (không liệt kê hết)
}

enum TenantStatus { PENDING ACTIVE LOCKED }

model Plan {
  id            String   @id @default(cuid())
  name          PlanName               // FREE | PRO
  maxRoutes     Int                     // giới hạn tuyến (null/-1 = không giới hạn)
  maxDrivers    Int
  features      Json                    // danh sách feature flag bật
  subscriptions Subscription[]
}

enum PlanName { FREE PRO }

model Subscription {
  id         String   @id @default(cuid())
  tenantId   String   @unique
  planId     String
  status     String   @default("active")
  startedAt  DateTime @default(now())
  expiresAt  DateTime?                  // null với Free
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  plan       Plan     @relation(fields: [planId], references: [id])
}

model Theme {
  id          String   @id @default(cuid())
  key         String   @unique          // "default", "theme-a", ...
  name        String                    // tên hiển thị tiếng Việt
  minPlan     PlanName @default(FREE)    // gói tối thiểu được dùng theme này
  isActive    Boolean  @default(true)
  tenants     Tenant[]
}

model PlatformUser {              // tài khoản Super Admin/Staff của MKT
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      PlatformRole @default(PLATFORM_STAFF)
  createdAt DateTime @default(now())
}

enum PlatformRole { SUPER_ADMIN PLATFORM_STAFF }

model PlatformAuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String
  tenantId  String?
  meta      Json?
  createdAt DateTime @default(now())
}

// ---------- LỚP NGHIỆP VỤ (đều có tenantId) ----------

model User {                       // chủ xe / điều hành / tài xế / khách
  id        String   @id @default(cuid())
  tenantId  String
  email     String
  password  String
  fullName  String?
  phone     String?
  role      TenantRole
  status    String   @default("active")  // active | locked
  createdAt DateTime @default(now())
  @@unique([tenantId, email])
  @@index([tenantId])
}

enum TenantRole { TENANT_ADMIN TENANT_OPERATOR DRIVER CUSTOMER }

model Driver {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?
  fullName    String
  avatarUrl   String?
  carType     String?
  carColor    String?
  plateNumber String?
  kycStatus   String   @default("pending")  // pending | approved | rejected
  cccdUrl     String?
  licenseUrl  String?
  registryUrl String?
  rating      Float    @default(5)
  tripCount   Int      @default(0)
  @@index([tenantId])
}

model Route {
  id        String   @id @default(cuid())
  tenantId  String
  fromName  String
  toName    String
  slug      String
  priceFrom Int
  distanceKm Int?
  durationText String?
  icon      String?
  @@unique([tenantId, slug])
  @@index([tenantId])
}

model Trip {
  id         String   @id @default(cuid())
  tenantId   String
  routeId    String
  driverId   String?
  departAt   DateTime
  seatsTotal Int
  seatsLeft  Int
  pricePerSeat Int
  serviceType String                     // ghep_1 | ghep_2 | bao_5 | bao_7 | gui_do
  status     String   @default("open")
  @@index([tenantId])
}

model Booking {                    // = lead đặt chỗ
  id          String   @id @default(cuid())
  tenantId    String
  tripId      String?
  fromName    String?
  toName      String?
  pickupAddr  String?
  dropoffAddr String?
  customerName String
  customerPhone String
  seats       Int      @default(1)
  serviceType String?
  couponCode  String?
  note        String?
  status      String   @default("new")   // new | confirmed | done | cancelled
  ip          String?
  device      String?
  createdAt   DateTime @default(now())
  @@index([tenantId])
}

model Transaction {
  id         String   @id @default(cuid())
  tenantId   String
  bookingId  String?
  driverId   String?
  amount     Int
  commission Int                          // hoa hồng (vd 12%) tính ở server
  status     String   @default("pending")
  createdAt  DateTime @default(now())
  @@index([tenantId])
}

model Coupon {
  id          String   @id @default(cuid())
  tenantId    String
  code        String
  type        String                      // percent | fixed
  value       Int
  minOrder    Int?
  maxDiscount Int?
  usageLimit  Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  @@unique([tenantId, code])
  @@index([tenantId])
}

model Article {                    // tin tức / blog
  id          String   @id @default(cuid())
  tenantId    String
  title       String
  slug        String
  coverUrl    String?
  contentHtml String                      // ĐÃ sanitize trước khi lưu
  status      String   @default("draft")  // draft | published
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  @@unique([tenantId, slug])
  @@index([tenantId])
}

model Review {
  id        String   @id @default(cuid())
  tenantId  String
  driverId  String?
  rating    Int
  content   String?
  authorName String?
  createdAt DateTime @default(now())
  @@index([tenantId])
}

model Complaint {
  id        String   @id @default(cuid())
  tenantId  String
  bookingId String?
  content   String
  status    String   @default("open")
  refunded  Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([tenantId])
}

model HomeContent {               // CMS trang chủ (1 bản / tenant)
  id        String   @id @default(cuid())
  tenantId  String   @unique
  data      Json                          // banner slideshow, hero, vì sao, cách đặt, FAQ, CTA
  updatedAt DateTime @updatedAt
}

model TenantSetting {             // cấu hình per-tenant (Telegram, SEO, GA4...)
  id              String  @id @default(cuid())
  tenantId        String  @unique
  telegramEnabled Boolean @default(false)
  telegramToken   String?
  telegramChatId  String?
  seoTitle        String?
  seoDescription  String?
  seoKeywords     String?
  ga4Id           String?
  searchConsoleId String?
  allowIndex      Boolean @default(true)
}

model AuditLog {                  // nhật ký thao tác trong tenant
  id        String   @id @default(cuid())
  tenantId  String
  actorId   String
  action    String
  meta      Json?
  createdAt DateTime @default(now())
  @@index([tenantId])
}
```

---

## 7. Resolve tenant theo host (middleware)

`src/middleware.ts`:
- Đọc `host` từ request.
- Nếu host = `<slug>.<ROOT_DOMAIN>` → tra `Tenant` theo `slug`.
- Nếu host = tên miền khác → tra `Tenant` theo `customDomain`.
- Nếu host là domain Control Plane (vd `control.<ROOT_DOMAIN>`) → bỏ qua tenant context, vào lớp Control Plane.
- Gắn `x-tenant-id` vào request headers; nếu không tìm thấy tenant ACTIVE → trả 404 (hoặc trang "site chưa kích hoạt" nếu PENDING, trang "site tạm khóa" nếu LOCKED).

---

## 8. Cô lập tenant ở tầng Prisma (BẮT BUỘC — phần quan trọng nhất)

Triển khai **một** trong hai cách, ưu tiên cách A:

**Cách A — Prisma Client Extension** (Prisma 5+): bọc client, tự chèn `where.tenantId` cho mọi model có field `tenantId` trong các thao tác `findMany/findFirst/findUnique/update/delete/count/aggregate`, và tự set `data.tenantId` khi `create`. `tenantId` lấy từ `tenant-context.ts` (AsyncLocalStorage) được set ở đầu mỗi request từ header `x-tenant-id`.

**Cách B — PostgreSQL Row-Level Security (RLS):** bật RLS, set `app.current_tenant` mỗi connection. Mạnh hơn nhưng phức tạp hơn với pooling.

**Quy tắc bắt buộc kèm theo:**
- Truy vấn cấp nền tảng (Control Plane) chạy qua một client KHÔNG áp extension tenant (gọi là `dbAdmin`), chỉ dùng trong `/control` và sau khi đã check `SUPER_ADMIN`.
- Mọi bảng nghiệp vụ ở Mục 6 đều phải nằm trong phạm vi cô lập.
- Viết test (Mục 15) chứng minh: tenant A không bao giờ đọc/ghi được dữ liệu tenant B.

---

## 9. Auth & RBAC

- Đăng nhập trả JWT trong cookie `httpOnly`. Payload chứa `userId`, `role`, `tenantId` (null với Super Admin).
- Helper `requireRole(...roles)` ở mỗi route handler; `requireTenantAdmin()`, `requireSuperAdmin()`.
- Khách (`CUSTOMER`): đăng ký bằng email + mật khẩu (KHÔNG OTP), quên mật khẩu (gửi link đặt lại), đổi mật khẩu, trang cá nhân, "Chuyến của tôi".
- Tài xế (`DRIVER`): đăng nhập riêng, dashboard, hồ sơ KYC.
- Chặn đăng nhập tài khoản `status = locked`.

---

## 10. Hệ thống phân tầng gói (entitlement)

`src/lib/entitlement.ts` cung cấp:
- `getPlan(tenantId)` → trả Plan hiện tại (Free/Pro) qua Subscription.
- `can(tenantId, feature)` → boolean theo `plan.features`.
- `assertWithinLimit(tenantId, 'routes' | 'drivers')` → ném lỗi nếu vượt giới hạn Free.

**Ma trận Free/Pro (kiểm tra ở server):**

| Tính năng | FREE | PRO |
|---|---|---|
| Tên miền | subdomain | tên miền riêng |
| Footer "Powered by MKT" | hiện (khóa) | ẩn được |
| Số tuyến / tài xế | giới hạn | không giới hạn |
| **Giao diện (theme)** | 1 giao diện cố định | chọn 1 trong 3 |
| Cổng tài xế tự đăng chuyến | chủ thêm tay | tài xế tự phục vụ |
| Mã giảm giá | tắt | bật |
| Báo cáo & xuất CSV | cơ bản | chi tiết theo tài xế/tuyến |
| SEO / GA4 / Search Console | cơ bản | đầy đủ |

> Footer "Powered by MKT" do gói quyết định: Free luôn hiện, không cho tắt; Pro cho phép ẩn. Kiểm tra ở server khi render.

---

## 11. Hệ thống giao diện (Theme)

- Mỗi theme nằm trong `src/themes/<key>/` gồm: layout + components + design tokens (màu, font, bố cục).
- **Nội dung tách khỏi theme:** mọi theme đọc CÙNG dữ liệu (`HomeContent`, `Route`, `Trip`, `Driver`, `Article`...). Đổi theme chỉ đổi cách render, KHÔNG đụng dữ liệu.
- Resolve theme: `tenant.themeId` → nếu null dùng theme `default`.
- **Gating:** Free chỉ được theme `default`. Pro chọn 1 trong các theme có `minPlan <= PRO` và `isActive = true`.
- **Mở rộng kho theme:** Super Admin thêm theme mới trong Control Plane (Mục 12.3). Theme mới `isActive = true` tự xuất hiện trong danh sách chọn cho tenant Pro — KHÔNG cần sửa từng site.
- MVP: tối thiểu 1 theme `default` (Free) + 2 theme khác (Pro) = 3 theme.

---

## 12. Đặc tả Module

### 12.A. Public site (khách đi xe) — route `(public)`
- **Trang chủ:** banner slideshow (admin sửa), form đặt xe (điểm đi/đến, ngày, dịch vụ), tuyến phổ biến (lưới thẻ, admin sửa điểm/giá/icon), "Vì sao chọn", "Cách đặt", FAQ, CTA tài xế. Tất cả lấy từ `HomeContent`.
- **Tìm chuyến** `/tim-chuyen`: lọc theo điểm đi/đến/ngày; sắp xếp Giờ đi sớm | Giá thấp | Đánh giá cao. Không có chuyến phù hợp → form "để lại thông tin" → tạo `Booking` (lead) + bắn Telegram.
- **Chi tiết chuyến / đặt chỗ:** thông tin tài xế (đã xác thực), loại xe, biển số (che bớt), số ghế trống, chọn ghế, nhập thông tin khách, mã giảm giá (kiểm tra ở server), gửi → tạo `Booking` + Telegram + màn xác nhận.
- **Đội ngũ tài xế** `/tai-xe-doi-tac`: danh sách + landing chi tiết từng tài xế.
- **Tin tức** `/tintuc`: danh sách phân trang 14 bài/trang, chi tiết bài + bài liên quan + banner cột bên, URL slug SEO.
- **Tài khoản khách:** đăng ký/đăng nhập email, quên/đổi mật khẩu, trang cá nhân, "Chuyến của tôi".
- Che SĐT/biển số ở khu công khai. Hotline hiển thị xuyên suốt (lấy từ tenant).

### 12.B. Tenant Admin (chủ xe) — route `/admin`
- **Dashboard:** tổng chuyến, biểu đồ theo Ngày|Tuần|Tháng, badge "việc cần xử lý" (lead mới, KYC chờ duyệt, khiếu nại mở).
- **Vận hành:** quản lý lead (`Booking`, có IP/thiết bị, mã giảm đã dùng); CRUD chuyến (gán tài xế, giá, ghế, giờ); CRUD tài xế (upload avatar, loại/màu xe, biển số); duyệt KYC (duyệt/từ chối); giao dịch (CRUD, hoa hồng 12% tính ở server); khiếu nại (có tùy chọn hoàn tiền); CRUD tuyến.
- **Nội dung & marketing:** CMS trang chủ (sửa toàn bộ thành phần); tin tức (soạn thảo + xem trước; **đăng bằng file .docx**, tải cả thư mục nhiều .docx; ảnh bìa chọn sẵn hoặc ngẫu nhiên; banner cột bên; thống kê bài viết); mã giảm giá (PRO: tạo mã %/cố định, đơn tối thiểu, trần giảm, giới hạn lượt, hạn dùng, bật/tắt).
- **Branding & giao diện:** logo, màu, hotline, tên miền (Pro); chọn giao diện theo gói (Mục 11); công tắc ẩn footer "Powered by MKT" (chỉ Pro).
- **Cấu hình:** Telegram Bot (token, chat id, gửi thử); SEO/GA4/Search Console; sitemap/robots tự sinh theo domain.
- **Phân quyền:** `TENANT_ADMIN` toàn quyền; `TENANT_OPERATOR` chỉ vận hành (không vào Cài đặt/Mã giảm/Nội dung/Nhân viên). Quản lý nhân viên (tạo, nâng/hạ quyền, khóa/mở). Audit log. Báo cáo doanh thu theo tài xế/tuyến + xuất CSV (mở Excel đúng tiếng Việt).

### 12.C. Cổng tài xế — route `/tai-xe`
- Đăng nhập riêng, dashboard.
- Hồ sơ KYC (CCCD, GPLX, đăng kiểm, ảnh xe) chờ admin duyệt.
- Quản lý chuyến của mình, xem đặt chỗ. Đổi mật khẩu / trang cá nhân.
- **PRO:** tài xế tự đăng chuyến. **FREE:** chủ xe thêm chuyến giúp.

### 12.D. Control Plane (Super Admin — MKT) — route `/control`
- **Dashboard:** tổng tenant; active/locked/pending; số theo gói Free/Pro; sắp hết hạn Pro; tỷ lệ kích hoạt; tỷ lệ Free→Pro.
- **Quản lý tenant:** danh sách (tên, chủ, subdomain/domain, gói, trạng thái, ngày tạo); tạo tenant mới (gán subdomain, gói khởi tạo); khóa/mở, đổi gói, gia hạn Pro, reset mật khẩu chủ xe, impersonate (đăng nhập thay mặt để hỗ trợ).
- **CRM-lite tự chứa:** hồ sơ khách (tên, SĐT, email, ngày mua MKT), lịch sử nâng cấp, ghi chú nội bộ, log. KHÔNG xây pipeline/automation.
- **Quản lý gói:** định nghĩa Free/Pro (giới hạn tuyến/tài xế, feature flag); ghi đè feature theo từng tenant.
- **Quản lý kho giao diện (theme):** thêm/sửa theme, đặt `minPlan`, bật/tắt.
- **Nhật ký & báo cáo nền tảng:** `PlatformAuditLog`; báo cáo tăng trưởng tenant, doanh thu Pro, tỷ lệ chuyển đổi; xuất CSV.
- **Thu phí Pro:** thủ công/chuyển khoản, đánh dấu trong tenant (gia hạn `expiresAt`).

---

## 13. Tích hợp & SEO

- **Telegram Bot API (thật):** gửi lead/đặt xe về group, kèm IP + thiết bị. Cấu hình per-tenant trong `TenantSetting`.
- **GA4 + Search Console + Bing:** mã cấu hình per-tenant.
- **Email** đặt lại mật khẩu: nối SMTP/Resend.
- **SEO:** `robots.txt` + `sitemap.xml` tự sinh theo domain thực tế của TỪNG tenant (gồm trang tĩnh, tuyến, mọi bài tin tức), có cache. Metadata động (title/description/canonical/OG) theo tenant + theo trang. URL slug cho tuyến/bài viết/tài xế.

---

## 14. Lộ trình build (theo thứ tự — Codex làm tuần tự)

### PHA 1 — MVP-Lite (mục tiêu lên sóng kinh doanh)
- **M0. Khởi tạo:** Next.js + Tailwind + Prisma + schema Mục 6 + seed (1 tenant mẫu, 1 plan Free, 1 plan Pro, 3 theme, vài tuyến/tài xế/bài viết).
- **M1. Multi-tenant nền tảng:** `middleware.ts` resolve host → tenant; `tenant-context.ts`; Prisma extension cô lập (Mục 8); auth + RBAC (Mục 9). **Cổng test:** bộ test cô lập tenant PASS.
- **M2. Control Plane + Gating + Kho giao diện:** `/control` (quản lý tenant, gói, entitlement, theme registry).
- **M3. Tenant Admin + Public site + Driver (bản Lite):** toàn bộ Module 12.A–12.C ở mức Free (đặt chỗ qua lead → Telegram, chủ thêm tài xế tay). Chọn giao diện theo gói. Branding. SEO + sitemap per-tenant.
- **M4. Onboarding:** wizard tạo site < 10 phút (brand, logo, màu, hotline, vài tuyến, chọn giao diện), bấm Xuất bản → site chạy trên subdomain.

### PHA 2 — Bản đầy đủ
- Mở khóa & hoàn thiện cổng tài xế tự phục vụ (Pro).
- Mở rộng kho giao diện (thêm theme mới cho Pro).
- Tự động hóa onboarding bằng mã kích hoạt; tên miền riêng tự cấu hình.
- Tối ưu tải cao: ISR cache, Redis rate-limit, PgBouncer, nhiều instance.
- (Tùy chọn) tổng đài ảo giấu số điện thoại.

---

## 15. Tiêu chí nghiệm thu & kiểm thử

**Test bắt buộc (cổng chặn merge):**
- `tests/tenant-isolation.spec.ts`: tạo 2 tenant A & B với dữ liệu riêng; xác nhận mọi truy vấn dưới context A KHÔNG trả/sửa được dữ liệu B (Route, Trip, Booking, Driver, Article, Transaction, ...). Thử cả tấn công qua tham số id chéo tenant → phải bị chặn.
- `tests/entitlement.spec.ts`: tenant Free vượt giới hạn tuyến/tài xế → bị chặn ở server; tenant Free đổi theme khác `default` → bị chặn; tenant Free ẩn footer → bị chặn.

**Tiêu chí kỹ thuật:**
- Chủ xe tạo site dùng được < 10 phút, không cần hỗ trợ.
- Thêm 1 tenant mới không phát sinh thao tác hạ tầng thủ công (sau Pha 2).
- Trang công khai tải < 2,5s.
- TypeScript strict, không lỗi build; Zod validate mọi input; không HTML chưa sanitize được lưu.

---

## 16. Quy ước code

- TypeScript strict. Tên biến/hàm/route/DB field: tiếng Anh. Text UI: tiếng Việt có dấu.
- Mọi route handler: validate input bằng Zod → check auth/role → check entitlement → thao tác DB (qua client đã cô lập tenant) → trả kết quả.
- Không truy vấn Prisma trực tiếp bỏ qua tầng cô lập, trừ `dbAdmin` trong `/control` (đã check `SUPER_ADMIN`).
- Không lưu secret trong code. Không log SĐT/biển số ra console ở prod.
- Commit nhỏ theo Module. Mỗi PR phải kèm test liên quan.

---

*Hết. File này bám sát PRD-Website-Xe-Ghep.docx. Khi PRD và file này mâu thuẫn, ưu tiên file này cho phần kỹ thuật; hỏi lại chủ sản phẩm (Phạm Tuân) cho phần nghiệp vụ.*
