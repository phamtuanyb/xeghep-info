-- CreateTable
CREATE TABLE "LandingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'Pro',
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "demoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandingTemplate_isActive_sortOrder_idx" ON "LandingTemplate"("isActive", "sortOrder");
