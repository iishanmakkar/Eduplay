/*
  Warnings:

  - You are about to drop the column `currency` on the `IndependentPaymentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `PaymentTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[analyticsId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `gameType` on the `GameResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `currencyCode` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'PAID_OUT', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_schoolId_fkey";

-- DropIndex
DROP INDEX "GameResult_matchId_idx";

-- DropIndex
DROP INDEX "Leaderboard_weekStart_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_googleId_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- DropIndex
DROP INDEX "User_schoolId_createdAt_idx";

-- DropIndex
DROP INDEX "User_teacherId_idx";

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN     "analyticsId" TEXT,
DROP COLUMN "gameType",
ADD COLUMN     "gameType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IndependentPaymentTransaction" DROP COLUMN "currency",
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "PaymentTransaction" DROP COLUMN "currency",
ADD COLUMN     "currencyCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "analyticsId" TEXT,
ADD COLUMN     "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "parentEmail" TEXT,
ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "UserAnalytics" (
    "id" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL DEFAULT 'Anonymous Learner',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "grade" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTemplate" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "standardId" TEXT NOT NULL,

    CONSTRAINT "QuestionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "taxRate" DOUBLE PRECISION DEFAULT 0.0,
    "locale" TEXT NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "RegionalPrice" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RegionalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "razorpayEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillNode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" "Subject" NOT NULL,
    "grade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "masteryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "slipProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "guessProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "transitProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkillMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "rewardType" TEXT NOT NULL DEFAULT 'SUBSCRIPTION_MONTH',
    "amount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Prerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Standard_code_key" ON "Standard"("code");

-- CreateIndex
CREATE INDEX "QuestionTemplate_standardId_idx" ON "QuestionTemplate"("standardId");

-- CreateIndex
CREATE INDEX "QuestionTemplate_gameType_difficulty_idx" ON "QuestionTemplate"("gameType", "difficulty");

-- CreateIndex
CREATE INDEX "RegionalPrice_currencyCode_idx" ON "RegionalPrice"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalPrice_plan_countryCode_key" ON "RegionalPrice"("plan", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_razorpayEventId_key" ON "WebhookEvent"("razorpayEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillNode_code_key" ON "SkillNode"("code");

-- CreateIndex
CREATE INDEX "UserSkillMastery_userId_idx" ON "UserSkillMastery"("userId");

-- CreateIndex
CREATE INDEX "UserSkillMastery_skillId_idx" ON "UserSkillMastery"("skillId");

-- CreateIndex
CREATE INDEX "UserSkillMastery_userId_lastPracticedAt_idx" ON "UserSkillMastery"("userId", "lastPracticedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillMastery_userId_skillId_key" ON "UserSkillMastery"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "ReferralLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_userId_key" ON "ReferralLink"("userId");

-- CreateIndex
CREATE INDEX "ReferralLink_userId_idx" ON "ReferralLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referredId_key" ON "ReferralReward"("referredId");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "_Prerequisites_AB_unique" ON "_Prerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_Prerequisites_B_index" ON "_Prerequisites"("B");

-- CreateIndex
CREATE INDEX "GameResult_analyticsId_idx" ON "GameResult"("analyticsId");

-- CreateIndex
CREATE INDEX "GameResult_gameType_idx" ON "GameResult"("gameType");

-- CreateIndex
CREATE INDEX "GameResult_studentId_gameType_idx" ON "GameResult"("studentId", "gameType");

-- CreateIndex
CREATE INDEX "Leaderboard_weekStart_weeklyXP_idx" ON "Leaderboard"("weekStart", "weeklyXP");

-- CreateIndex
CREATE UNIQUE INDEX "User_analyticsId_key" ON "User"("analyticsId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTemplate" ADD CONSTRAINT "QuestionTemplate_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "UserAnalytics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MultiplayerMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalPrice" ADD CONSTRAINT "RegionalPrice_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndependentPaymentTransaction" ADD CONSTRAINT "IndependentPaymentTransaction_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillMastery" ADD CONSTRAINT "UserSkillMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillMastery" ADD CONSTRAINT "UserSkillMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
