set -e

cd /var/www/xeghepyenbai

cp docker-compose.yml docker-compose.yml.bak-codex-wildcard
cp .env.production .env.production.bak-codex-wildcard

mkdir -p deploy

cat > deploy/Dockerfile.caddy <<'EOF'
FROM caddy:builder AS builder
RUN xcaddy build --with github.com/caddy-dns/cloudflare

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
EOF

python3 - <<'PY'
from pathlib import Path

env_path = Path('/var/www/xeghepyenbai/.env.production')
lines = env_path.read_text().splitlines()
token_line = 'CLOUDFLARE_API_TOKEN=__CF_TOKEN__'

updated = []
found = False
for line in lines:
    if line.startswith('CLOUDFLARE_API_TOKEN='):
        updated.append(token_line)
        found = True
    else:
        updated.append(line)

if not found:
    updated.append(token_line)

env_path.write_text('\n'.join(updated) + '\n')
PY

python3 - <<'PY'
from pathlib import Path

compose_path = Path('/var/www/xeghepyenbai/docker-compose.yml')
text = compose_path.read_text()

if 'dockerfile: Dockerfile.caddy' not in text:
    text = text.replace(
        "  caddy:\n    image: caddy:2-alpine\n",
        "  caddy:\n    build:\n      context: ./deploy\n      dockerfile: Dockerfile.caddy\n",
    )

if '    env_file:\n      - .env.production\n' not in text:
    text = text.replace(
        "    environment:\n      SITE_DOMAIN: ${SITE_DOMAIN:-:80}\n      ACME_EMAIL: ${ACME_EMAIL:-}\n",
        "    env_file:\n      - .env.production\n    environment:\n      SITE_DOMAIN: ${SITE_DOMAIN:-:80}\n      ACME_EMAIL: ${ACME_EMAIL:-}\n",
    )

compose_path.write_text(text)
PY

python3 - <<'PY'
import json
import urllib.request
import urllib.parse

token = "__CF_TOKEN__"
ip = "116.118.4.211"
zone_name = "nhansuchat.net"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

def api(method, path, payload=None):
    data = None
    if payload is not None:
      data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}",
        data=data,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

zone_resp = api("GET", "/zones?" + urllib.parse.urlencode({"name": zone_name}))
zone_id = zone_resp["result"][0]["id"]

for name in [zone_name, f"*.{zone_name}"]:
    records = api("GET", f"/zones/{zone_id}/dns_records?" + urllib.parse.urlencode({"type": "A", "name": name}))["result"]
    payload = {
        "type": "A",
        "name": name,
        "content": ip,
        "ttl": 1,
        "proxied": False,
    }
    if records:
        api("PUT", f"/zones/{zone_id}/dns_records/{records[0]['id']}", payload)
    else:
        api("POST", f"/zones/{zone_id}/dns_records", payload)
PY

cat > /var/lib/docker/volumes/xeghepyenbai_caddy_config/_data/caddy-live.Caddyfile <<'EOF'
{
  email phamtuan91yb@gmail.com
}

nhansuchat.net, *.nhansuchat.net {
  tls {
    dns cloudflare {env.CLOUDFLARE_API_TOKEN}
  }

  encode gzip zstd

  reverse_proxy 172.17.0.1:3001 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
}

:80 {
  encode gzip zstd

  reverse_proxy app:3000 {
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
}
EOF

docker compose --env-file .env.production up -d --build caddy
docker exec xeghepyenbai-caddy-1 caddy list-modules | grep dns.providers.cloudflare
docker exec xeghepyenbai-caddy-1 caddy validate --config /config/caddy-live.Caddyfile
docker exec xeghepyenbai-caddy-1 caddy reload --config /config/caddy-live.Caddyfile

curl -k -I --resolve nhansuchat.net:443:127.0.0.1 https://nhansuchat.net/kich-hoat | head
curl -k -I --resolve nha-xe-an-binh.nhansuchat.net:443:127.0.0.1 https://nha-xe-an-binh.nhansuchat.net/ | head
