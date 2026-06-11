cd /var/www/xeghep-info
cat > codex-map-domain.js <<'EOF'
const { PrismaClient } = require("/app/node_modules/@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "nha-xe-an-binh" },
  });

  if (!tenant) {
    throw new Error("tenant not found");
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      customDomain: "nhansuchat.net",
      customDomainVerified: true,
      status: "ACTIVE",
    },
  });

  console.log(
    JSON.stringify({
      id: tenant.id,
      slug: tenant.slug,
      customDomain: "nhansuchat.net",
    }),
  );
})()
  .finally(() => prisma.$disconnect());
EOF

docker cp codex-map-domain.js xeghep-info-app-1:/tmp/codex-map-domain.js
docker exec xeghep-info-app-1 node /tmp/codex-map-domain.js
