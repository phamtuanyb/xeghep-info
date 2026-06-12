# Hướng dẫn deploy lên VPS — Nền tảng xe ghép (xeghep.info)

Triển khai bằng **Docker Compose** (Postgres + app) + **Caddy** lo HTTPS tự động cho:

- `xeghep.info` (Control Plane + landing nền tảng)
- **Free**: `<slug>.xeghep.info` (vd `nhaxe.xeghep.info`)
- **Pro**: subdomain như trên **+ tên miền riêng** của khách (vd `nhaxecuaban.vn`)

> File liên quan: [Dockerfile](Dockerfile), [docker-compose.prod.yml](docker-compose.prod.yml), [deploy/Caddyfile](deploy/Caddyfile).

---

## 0. Chuẩn bị VPS (1 lần)

- VPS Ubuntu/Debian, mở **port 80 và 443** (firewall/security group).
- Cài Docker + Docker Compose plugin:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # đăng xuất/đăng nhập lại
  ```
- Cài Caddy (reverse proxy + TLS) — chạy như service hệ thống:
  ```bash
  sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt update && sudo apt install -y caddy
  ```

---

## 1. DNS (cấu hình 1 lần tại nơi quản lý `xeghep.info`)

| Bản ghi | Tên (Host) | Loại | Trỏ tới |
|---|---|---|---|
| Gốc | `@` | `A` | `<IP_VPS>` |
| Wildcard subdomain | `*` | `A` | `<IP_VPS>` |
| Control (tuỳ chọn) | `control` | `A` | `<IP_VPS>` |

> `*.xeghep.info` giúp **mọi tenant Free/Pro chạy ngay** trên subdomain mà không phải thêm DNS từng tenant.

---

## 2. Lấy code + cấu hình môi trường

```bash
git clone <repo-url> xeghep && cd xeghep
```

Tạo file **`.env.production`** (KHÔNG commit):

```
# Postgres (compose tự dựng DB từ các biến này)
POSTGRES_DB=xeghep_info
POSTGRES_USER=xeghep_info
POSTGRES_PASSWORD=<mật khẩu DB mạnh>

# Bảo mật
JWT_SECRET=<chuỗi ngẫu nhiên >= 32 ký tự>

# Tên miền
ROOT_DOMAIN=xeghep.info
APP_BASE_URL=https://xeghep.info
PLATFORM_SERVER_IP=<IP_VPS>          # hiện trong hướng dẫn DNS cho khách Pro

# Cổng app trên host (Caddy proxy vào cổng này — đã khớp deploy/Caddyfile)
APP_PORT=3001

# Tích hợp (tuỳ chọn)
TELEGRAM_BOT_TOKEN=                  # token bot Telegram (BotFather)
PLATFORM_TELEGRAM_CHAT_ID=          # chat id nhận LEAD từ trang gốc xeghep.info (Telegram MKT)
RESEND_API_KEY=
REDIS_URL=
```

> Lấy `PLATFORM_TELEGRAM_CHAT_ID`: tạo bot ở @BotFather (ra `TELEGRAM_BOT_TOKEN`), thêm bot vào group nhận lead, gửi 1 tin trong group, mở `https://api.telegram.org/bot<TOKEN>/getUpdates` để xem `chat.id` (group thường là số âm).

> `DATABASE_URL`/`DIRECT_URL` do compose tự đặt (trỏ vào service `db`), không cần khai ở đây.

---

## 3. Build & chạy (Docker)

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

- Lệnh này **build image** (`npm run build`), dựng **Postgres** + **app**.
- Container app khi khởi động tự chạy `prisma migrate deploy` (áp migration).
- App lắng nghe ở **host: `127.0.0.1:3001`** (Caddy sẽ proxy vào đây).

**Seed dữ liệu lần đầu** (Super Admin, gói Free/Pro, theme):
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app npm run db:seed
```
> Sau seed, đổi ngay mật khẩu Super Admin (`admin@xeghep-mkt.vn` / mật khẩu seed) trong Control Plane.

Xem log / trạng thái:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

---

## 4. Caddy (HTTPS tự động)

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile      # đổi email admin@xeghep.info thành email thật
sudo systemctl reload caddy
```

Caddy tự xin Let's Encrypt cho từng host khi có request, sau khi hỏi
`http://127.0.0.1:3001/api/tls-check` (chỉ cấp cho host hợp lệ: nền tảng, subdomain
tenant đang tồn tại, hoặc tên miền riêng đã đăng ký). Cert lưu bền trong `/var/lib/caddy`.

Kiểm tra: mở `https://xeghep.info` và `https://<slug>.xeghep.info`.

---

## 5. Tên miền riêng cho khách Pro

Khách vào **Admin → Tên miền riêng**, nhập domain (vd `nhaxecuaban.vn`) rồi trỏ DNS
theo hướng dẫn hiển thị (lấy IP từ `PLATFORM_SERVER_IP`):

| Tên (Host) | Loại | Trỏ tới |
|---|---|---|
| `@` (gốc) | `A` | `<IP_VPS>` |
| `www` | `CNAME` | `xeghep.info` |

Sau khi DNS cập nhật, Caddy tự cấp HTTPS (on-demand) và khách bấm **"Xác thực ngay"**.

---

## 6. Dữ liệu được giữ qua mỗi lần deploy

Đã cấu hình volume trong compose — **không mất dữ liệu khi rebuild**:

| Dữ liệu | Lưu ở |
|---|---|
| Database | volume `postgres_data` |
| Ảnh admin tải lên (logo/about) | `./data/uploads` trên host |
| Kho ảnh bài viết theo từng site | `./data/article-images` trên host |

> Nhớ **backup** thư mục `./data/` và volume `postgres_data` định kỳ.

---

## 7. Cập nhật phiên bản mới

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
Migration tự áp khi container khởi động. Caddy không cần đụng tới.

---

## 8. Sao lưu / phục hồi nhanh

```bash
# Backup DB
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  pg_dump -U xeghep_info xeghep_info > backup-$(date +%F).sql

# Backup ảnh
tar czf data-$(date +%F).tar.gz data/
```

---

## Ghi chú rate-limit Let's Encrypt

On-demand cấp cert riêng theo từng host; giới hạn ~50 cert mới/tuần cho mỗi *registered
domain*. Nếu có rất nhiều subdomain `*.xeghep.info` mới mỗi tuần, nâng cấp dùng **cert
wildcard `*.xeghep.info`** qua thử thách DNS-01 (cần plugin DNS của Caddy + API token nhà
cung cấp DNS), chỉ để on-demand cho tên miền riêng của khách.
