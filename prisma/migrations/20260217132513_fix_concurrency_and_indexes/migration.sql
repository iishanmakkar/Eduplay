/*
  Warnings:

  - A unique constraint covering the columns `[matchId,studentId]` on the table `GameResult` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "School" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "GameResult_studentId_gameType_idx" ON "GameResult"("studentId", "gameType");

-- CreateIndex
CREATE UNIQUE INDEX "GameResult_matchId_studentId_key" ON "GameResult"("matchId", "studentId");
