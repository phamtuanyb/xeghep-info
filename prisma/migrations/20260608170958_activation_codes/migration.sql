-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "planName" "PlanName" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'active',
    "usedByTenantId" TEXT,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- CreateIndex
CREATE INDEX "ActivationCode_status_idx" ON "ActivationCode"("status");
