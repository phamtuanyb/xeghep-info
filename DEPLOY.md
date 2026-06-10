# Triển khai VPS — Nền tảng xe ghép (xeghep.info)

Hướng dẫn dựng nền tảng đa tenant trên VPS với **Caddy** lo HTTPS tự động cho:

- `xeghep.info` (Control Plane + landing nền tảng)
- **Free**: `<slug>.xeghep.info` (vd `nhaxe.xeghep.info`)
- **Pro**: subdomain như trên **+ tên miền riêng** của khách (vd `nhaxecuaban.vn`)

---

## 1. DNS của nền tảng (bạn cấu hình 1 lần tại nơi quản lý `xeghep.info`)

| Bản ghi | Tên (Host) | Loại | Trỏ tới |
|---|---|---|---|
| Gốc | `@` | `A` | `<IP_VPS>` |
| Wildcard subdomain | `*` | `A` | `<IP_VPS>` |
| Control (tuỳ chọn) | `control` | `A` | `<IP_VPS>` |

> Bản ghi wildcard `*.xeghep.info` giúp **mọi tenant Free/Pro tự chạy ngay** trên subdomain mà không phải thêm DNS cho từng tenant.

---

## 2. Biến môi trường (`.env` trên VPS)

```
DATABASE_URL=postgresql://...           # Postgres production (PgBouncer nếu tải cao)
DIRECT_URL=postgresql://...             # kết nối trực tiếp cho prisma migrate
JWT_SECRET=<chuỗi ngẫu nhiên >= 32 ký tự>
ROOT_DOMAIN=xeghep.info
APP_BASE_URL=https://xeghep.info
PLATFORM_SERVER_IP=<IP_VPS>             # hiện trong hướng dẫn DNS cho khách Pro
REDIS_URL=redis://...                   # rate-limit / cache
```

## 3. Chạy ứng dụng (Node, cổng nội bộ 3000)

```bash
npm ci
npx prisma migrate deploy
npm run build
# chạy nền bằng pm2 (hoặc systemd)
pm2 start "npm run start" --name xeghep -- -p 3000
```

## 4. Caddy (HTTPS tự động)

```bash
# Cài Caddy (Debian/Ubuntu) — xem caddyserver.com/docs/install
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
# sửa email trong Caddyfile thành email thật của bạn
sudo systemctl reload caddy
```

Mở tường lửa port **80** và **443**. Caddy sẽ tự xin Let's Encrypt cho từng host khi
có request, sau khi hỏi `http://127.0.0.1:3000/api/tls-check` (chỉ cấp cho host hợp lệ).

---

## 5. Tên miền riêng cho khách Pro

Khách vào **Admin → Tên miền riêng**, nhập domain (vd `nhaxecuaban.vn`) rồi làm theo
hướng dẫn DNS hiển thị (lấy IP từ `PLATFORM_SERVER_IP`):

| Tên (Host) | Loại | Trỏ tới |
|---|---|---|
| `@` (gốc) | `A` | `<IP_VPS>` |
| `www` | `CNAME` | `xeghep.info` |

Sau khi DNS cập nhật, Caddy tự cấp HTTPS (on-demand) và khách bấm **"Xác thực ngay"**
(`/api/health` so khớp tenantId). App phục vụ đúng site theo `customDomain` (cả `www`).

> **Rate-limit Let's Encrypt:** on-demand cấp cert riêng theo từng host. Giới hạn ~50
> cert mới/tuần cho mỗi *registered domain*. Với nhiều subdomain `*.xeghep.info`, nếu
> vượt ngưỡng hãy nâng cấp dùng **cert wildcard `*.xeghep.info`** qua thử thách DNS-01
> (cần token API của nhà cung cấp DNS) — chỉ để on-demand cho tên miền riêng của khách.
