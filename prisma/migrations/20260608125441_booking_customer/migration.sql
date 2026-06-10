-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_tenantId_customerId_idx" ON "Booking"("tenantId", "customerId");
