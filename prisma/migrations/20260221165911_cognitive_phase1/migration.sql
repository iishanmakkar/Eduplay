-- CreateEnum
CREATE TYPE "GradeBand" AS ENUM ('BAND_1', 'BAND_2', 'BAND_3', 'BAND_4', 'BAND_5');

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN     "eprDelta" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gradeBand" "GradeBand";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "schoolRegion" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "epr" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "gradeBand" "GradeBand";

-- CreateIndex
CREATE INDEX "School_schoolRegion_idx" ON "School"("schoolRegion");
