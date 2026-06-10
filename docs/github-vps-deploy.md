# Deploy GitHub -> VPS

Tài liệu này dùng cho luồng triển khai production:

1. Đẩy source lên GitHub.
2. VPS clone repository.
3. Mỗi lần push vào nhánh `master`, GitHub Actions SSH vào VPS.
4. VPS pull code mới, chạy migration, build Next.js và restart bằng PM2.

## 1. Chuẩn bị GitHub

Tạo repository trên GitHub, ví dụ:

```bash
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin master
```

Nếu muốn dùng nhánh `main`, đổi tên nhánh trước rồi sửa `.github/workflows/deploy-vps.yml`.

## 2. Chuẩn bị VPS

Ví dụ Ubuntu 22.04/24.04:

```bash
sudo apt update
sudo apt install -y git curl postgresql redis-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Cài Caddy theo hướng dẫn chính thức rồi copy `deploy/Caddyfile` vào `/etc/caddy/Caddyfile`.

Tạo thư mục app:

```bash
sudo mkdir -p /var/www/xeghep
sudo chown -R $USER:$USER /var/www/xeghep
```

Clone lần đầu:

```bash
git clone git@github.com:<owner>/<repo>.git /var/www/xeghep
cd /var/www/xeghep
```

Tạo file `.env` production trên VPS, không commit file này:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="<chuoi-bi-mat-it-nhat-32-ky-tu>"
ROOT_DOMAIN="xeghep.info"
APP_BASE_URL="https://xeghep.info"
PLATFORM_SERVER_IP="<IP_VPS>"
REDIS_URL="redis://localhost:6379"
```

Chạy deploy thủ công lần đầu:

```bash
chmod +x deploy/vps-deploy.sh
APP_DIR=/var/www/xeghep DEPLOY_BRANCH=master bash deploy/vps-deploy.sh
```

## 3. GitHub Secrets

Vào GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret.

Bắt buộc:

- `VPS_HOST`: IP hoặc hostname của VPS.
- `VPS_USER`: user SSH trên VPS.
- `VPS_SSH_KEY`: private key dùng để SSH vào VPS.
- `REPO_URL`: URL repository mà VPS dùng để clone, ví dụ `git@github.com:<owner>/<repo>.git`.

Tuỳ chọn:

- `VPS_PORT`: mặc định `22`.
- `APP_DIR`: mặc định `/var/www/xeghep`.
- `DEPLOY_BRANCH`: mặc định `master`.

## 4. DNS

Trỏ DNS của `xeghep.info` về VPS:

| Host | Type | Value |
|---|---|---|
| `@` | `A` | `<IP_VPS>` |
| `*` | `A` | `<IP_VPS>` |
| `control` | `A` | `<IP_VPS>` |

Mở firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 5. Kiểm tra sau deploy

```bash
pm2 status
pm2 logs xeghep
curl -I https://xeghep.info
```

Nếu migration lỗi, dừng deploy và kiểm tra `DATABASE_URL`, `DIRECT_URL`, trạng thái Postgres và schema Prisma trước khi chạy lại.
