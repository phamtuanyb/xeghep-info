cd /var/www/xeghep-info

python3 - <<'PY'
from pathlib import Path

env_path = Path("/var/www/xeghep-info/.env.production")
lines = env_path.read_text().splitlines()
updated = []
for line in lines:
    if line.startswith("ROOT_DOMAIN="):
        updated.append("ROOT_DOMAIN=nhansuchat.net")
    elif line.startswith("APP_BASE_URL="):
        updated.append("APP_BASE_URL=http://nhansuchat.net")
    else:
        updated.append(line)
env_path.write_text("\n".join(updated) + "\n")
PY

python3 - <<'PY'
from pathlib import Path

p = Path("/var/lib/docker/volumes/xeghepyenbai_caddy_config/_data/caddy-live.Caddyfile")
text = p.read_text()

old = "http://xeghep.info, http://www.xeghep.info, https://xeghep.info, https://www.xeghep.info, http://nhansuchat.net, http://www.nhansuchat.net, https://nhansuchat.net, https://www.nhansuchat.net {"
new = "http://xeghep.info, http://www.xeghep.info, https://xeghep.info, https://www.xeghep.info, http://nhansuchat.net, http://www.nhansuchat.net, https://nhansuchat.net, https://www.nhansuchat.net, http://*.nhansuchat.net {"

if old in text and "http://*.nhansuchat.net" not in text:
    text = text.replace(old, new)

p.write_text(text)
PY

cat > codex-reset-root-domain.js <<'EOF'
const { PrismaClient } = require("/app/node_modules/@prisma/client");
const prisma = new PrismaClient();

(async () => {
  await prisma.tenant.updateMany({
    where: { customDomain: "nhansuchat.net" },
    data: { customDomain: null, customDomainVerified: false },
  });

  const tenants = await prisma.tenant.findMany({
    select: { slug: true, customDomain: true, status: true },
    orderBy: { slug: "asc" },
  });

  console.log(JSON.stringify(tenants));
})().finally(() => prisma.$disconnect());
EOF

docker cp codex-reset-root-domain.js xeghep-info-app-1:/tmp/codex-reset-root-domain.js
docker exec xeghep-info-app-1 node /tmp/codex-reset-root-domain.js

docker exec xeghepyenbai-caddy-1 caddy validate --config /config/caddy-live.Caddyfile
docker exec xeghepyenbai-caddy-1 caddy reload --config /config/caddy-live.Caddyfile

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build app
