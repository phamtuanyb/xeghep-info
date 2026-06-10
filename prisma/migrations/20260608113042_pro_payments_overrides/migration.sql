-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "priceMonthly" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "featureOverrides" JSONB;

-- CreateTable
CREATE TABLE "ProPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank',
    "months" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProPayment_tenantId_idx" ON "ProPayment"("tenantId");

-- CreateIndex
CREATE INDEX "ProPayment_createdAt_idx" ON "ProPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "ProPayment" ADD CONSTRAINT "ProPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
