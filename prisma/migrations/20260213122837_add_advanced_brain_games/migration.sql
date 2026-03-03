-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'CODE_BREAKER';
ALTER TYPE "GameType" ADD VALUE 'MATH_GRID';
ALTER TYPE "GameType" ADD VALUE 'VISUAL_ROTATION';
ALTER TYPE "GameType" ADD VALUE 'SEQUENCE_BUILDER';
ALTER TYPE "GameType" ADD VALUE 'ANALOGY_GAME';
ALTER TYPE "GameType" ADD VALUE 'ATTENTION_SWITCH';
ALTER TYPE "GameType" ADD VALUE 'TIME_PLANNER';
ALTER TYPE "GameType" ADD VALUE 'SHAPE_CONSTRUCTOR';
ALTER TYPE "GameType" ADD VALUE 'RIDDLE_SPRINT';
ALTER TYPE "GameType" ADD VALUE 'LOGIC_GRID';
