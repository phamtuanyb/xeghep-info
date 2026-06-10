# Triển khai tải cao (PHA 2) — PgBouncer + nhiều instance + cache

Tài liệu hướng dẫn vận hành nền tảng xe ghép ở môi trường tải cao theo CLAUDE.md Mục 14.
Ba trụ cột: **(1) PgBouncer gom kết nối DB**, **(2) chạy nhiều instance app sau load balancer**,
**(3) cache** (Data Cache theo tenant + Redis rate-limit + shared cache giữa các instance).

---

## 1. PgBouncer (gom kết nối PostgreSQL)

Prisma mở nhiều kết nối; khi chạy nhiều instance × nhiều connection sẽ vượt `max_connections`
của Postgres. PgBouncer (transaction pooling) gom lại.

### 1.1. Hai URL: pooled vs direct
Schema đã khai báo:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // runtime, qua PgBouncer
  directUrl = env("DIRECT_URL")   // migrate/introspect, trực tiếp (bỏ qua pooler)
}
```
- `DATABASE_URL` (qua PgBouncer): **bắt buộc** thêm `?pgbouncer=true&connection_limit=1`.
  - `pgbouncer=true`: tắt prepared statements (không tương thích transaction pooling).
  - `connection_limit=1`: mỗi instance chỉ giữ 1 kết nối tới PgBouncer.
- `DIRECT_URL` (trực tiếp tới Postgres): dùng cho `prisma migrate deploy` lúc release.

Ví dụ:
```
DATABASE_URL="postgresql://xeghep:pw@pgbouncer-host:6432/xeghep?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://xeghep:pw@postgres-host:5432/xeghep"
```

### 1.2. Cấu hình PgBouncer (`pgbouncer.ini`)
```ini
[databases]
xeghep = host=postgres-host port=5432 dbname=xeghep

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction          ; BẮT BUỘC transaction pooling cho Prisma serverless/multi-instance
max_client_conn = 1000           ; số client tối đa (instance × connection_limit × hệ số)
default_pool_size = 20           ; số kết nối thật tới Postgres mỗi database
server_idle_timeout = 60
```
> `pool_mode = transaction` + `pgbouncer=true` trong URL là cặp đi liền. KHÔNG dùng session pooling.

### 1.3. Migrate ở môi trường có PgBouncer
```bash
# Chạy migrate qua DIRECT_URL (không qua pooler), khi deploy:
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
# hoặc Prisma tự dùng directUrl cho migrate khi đã khai báo ở datasource.
```

---

## 2. Chạy nhiều instance (scale ngang)

App **stateless** (JWT trong cookie `httpOnly`, không có session dính server) nên scale ngang dễ:
không cần sticky session.

### 2.1. PM2 cluster (1 VPS, nhiều core)
```bash
npm run build
pm2 start npm --name xeghep -i max -- run start   # -i max = 1 process/core
```

### 2.2. Nhiều container sau load balancer (nginx)
```nginx
upstream xeghep {
  least_conn;
  server app1:3000;
  server app2:3000;
  server app3:3000;
}
server {
  listen 443 ssl;
  server_name *.xeghep-mkt.vn;            # subdomain tenant
  location / {
    proxy_pass http://xeghep;
    proxy_set_header Host $host;          # GIỮ Host để middleware resolve tenant
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # cho rate-limit + log IP
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
> Quan trọng: phải chuyển tiếp `Host` (middleware đọc host → tenant) và `X-Forwarded-For`
> (rate-limit theo IP, log lead theo IP/thiết bị).

### 2.3. docker-compose (app + pgbouncer + redis) — phác thảo
```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer
    environment: { DB_HOST: postgres, DB_PORT: 5432, POOL_MODE: transaction, MAX_CLIENT_CONN: 1000, DEFAULT_POOL_SIZE: 20 }
    ports: ["6432:6432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  app:
    image: xeghep:latest
    deploy: { replicas: 3 }              # nhiều instance
    environment:
      DATABASE_URL: "postgresql://xeghep:pw@pgbouncer:6432/xeghep?pgbouncer=true&connection_limit=1"
      DIRECT_URL: "postgresql://xeghep:pw@postgres:5432/xeghep"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: "<>=32 ký tự>"
      ROOT_DOMAIN: "xeghep-mkt.vn"
  nginx:
    image: nginx
    ports: ["443:443"]
    depends_on: [app]
```

---

## 3. Cache

### 3.1. Data Cache theo tenant (đã có — `src/lib/public-cache.ts`)
- Trang công khai (chủ/tài xế/tin tức) đọc qua `unstable_cache` keyed theo `tenantId`,
  `revalidate = 60s` + tag `tenant-public:<tenantId>`.
- Admin sửa nội dung → `revalidateTenantPublic(tenantId)` xóa cache ngay (đã gắn vào các
  action: CMS, tuyến, tài xế/KYC, tin tức, branding, theme, onboarding).
- Vì cache key gồm tenantId và hàm dùng `dbAdmin` lọc tenantId tường minh → **không lẫn
  dữ liệu giữa tenant**.

### 3.2. Shared cache giữa nhiều instance
Mặc định Next.js Data Cache lưu **trên đĩa từng instance** → 3 instance = 3 bản cache rời.
Để dùng chung (và `revalidateTag` lan ra mọi instance), cấu hình `cacheHandler` Redis trong
`next.config.js`:
```js
// next.config.js (production, nhiều instance)
const nextConfig = {
  cacheHandler: require.resolve('./cache-handler.js'), // handler Redis (vd @neshca/cache-handler)
  cacheMaxMemorySize: 0, // tắt cache in-memory mặc định
};
```
Gợi ý dùng `@neshca/cache-handler` (Redis-backed) để chia sẻ Data Cache + tag invalidation
giữa các instance. Khi chưa cài, mỗi instance tự cache (vẫn đúng, chỉ kém hiệu quả hơn một chút
và `revalidateTag` chỉ tác động instance nhận request — chấp nhận được với `revalidate=60s`).

### 3.3. Redis rate-limit (đã có — `src/lib/rate-limit.ts`)
- Cửa sổ cố định INCR+EXPIRE, **dùng chung Redis** nên giới hạn chính xác khi scale ngang.
- Áp cho: đặt xe/lead, đăng ký, đăng nhập (khách/chủ xe/tài xế), quên mật khẩu.
- **Fail-open**: Redis chết → cho qua (không chặn người dùng thật).

---

## 4. CDN / cache tầng biên (tùy chọn, khuyến nghị)
- Đặt CDN (Cloudflare/Fastly) trước nginx cho **asset tĩnh** `/_next/static/*` (immutable, cache lâu).
- Ảnh tối ưu qua `next/image` + `sharp` (đã bật).
- Trang HTML công khai là động (resolve theo host) — không cache HTML ở CDN trừ khi cấu hình
  cache-key gồm Host + đặt TTL ngắn.

## 5. Checklist vận hành tải cao
- [ ] `DATABASE_URL` qua PgBouncer có `pgbouncer=true&connection_limit=1`; `DIRECT_URL` trực tiếp.
- [ ] PgBouncer `pool_mode=transaction`, `default_pool_size` hợp lý với `max_connections` Postgres.
- [ ] `JWT_SECRET` ≥ 32 ký tự; cookie `secure` bật (HTTPS).
- [ ] nginx chuyển tiếp `Host`, `X-Forwarded-For`, `X-Real-IP`.
- [ ] Redis dùng chung cho rate-limit (và lý tưởng là cacheHandler).
- [ ] Nhiều instance (PM2 `-i max` hoặc replicas) — app stateless nên không cần sticky session.
- [ ] Đo lại tốc độ: TTFB trang chủ < 2,5s (Mục 15).
