-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "hidePoweredBy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "ownerEmail" TEXT,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "purchasedAt" TIMESTAMP(3);
