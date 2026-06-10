-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'PLATFORM_STAFF');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('TENANT_ADMIN', 'TENANT_OPERATOR', 'DRIVER', 'CUSTOMER');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "themeId" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#1565C0',
    "hotline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" "PlanName" NOT NULL,
    "maxRoutes" INTEGER NOT NULL,
    "maxDrivers" INTEGER NOT NULL,
    "features" JSONB NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPlan" "PlanName" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'PLATFORM_STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tenantId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "role" "TenantRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "carType" TEXT,
    "carColor" TEXT,
    "plateNumber" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "cccdUrl" TEXT,
    "licenseUrl" TEXT,
    "registryUrl" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "tripCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "distanceKm" INTEGER,
    "durationText" TEXT,
    "icon" TEXT,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT,
    "departAt" TIMESTAMP(3) NOT NULL,
    "seatsTotal" INTEGER NOT NULL,
    "seatsLeft" INTEGER NOT NULL,
    "pricePerSeat" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT,
    "fromName" TEXT,
    "toName" TEXT,
    "pickupAddr" TEXT,
    "dropoffAddr" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "serviceType" TEXT,
    "couponCode" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ip" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT,
    "driverId" TEXT,
    "amount" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrder" INTEGER,
    "maxDiscount" INTEGER,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverUrl" TEXT,
    "contentHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeContent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramToken" TEXT,
    "telegramChatId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ga4Id" TEXT,
    "searchConsoleId" TEXT,
    "allowIndex" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_key_key" ON "Theme"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_tenantId_idx" ON "PlatformAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_actorId_idx" ON "PlatformAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Driver_tenantId_idx" ON "Driver"("tenantId");

-- CreateIndex
CREATE INDEX "Route_tenantId_idx" ON "Route"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_tenantId_slug_key" ON "Route"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Trip_tenantId_idx" ON "Trip"("tenantId");

-- CreateIndex
CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");

-- CreateIndex
CREATE INDEX "Coupon_tenantId_idx" ON "Coupon"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_tenantId_code_key" ON "Coupon"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Article_tenantId_idx" ON "Article"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_tenantId_slug_key" ON "Article"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Review_tenantId_idx" ON "Review"("tenantId");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_idx" ON "Complaint"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeContent_tenantId_key" ON "HomeContent"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key" ON "TenantSetting"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeContent" ADD CONSTRAINT "HomeContent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
