-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Case_updatedAt_idx" ON "Case"("updatedAt");
