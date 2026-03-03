
import { prisma } from '@/lib/prisma'
import { GameType, Achievement } from '@prisma/client'
import { BADGE_DEFINITIONS, BadgeDefinition } from './badges'
import { calculateXP, calculateLevel } from '@/lib/utils'
import { incrementLeaderboardXP, incrementEPR } from '@/lib/cache/leaderboard'

export interface GamificationResult {
    xpEarned: number
    oldLevel: number
    newLevel: number
    levelUp: boolean
    currentStreak: number
    newlyUnlockedBadges: BadgeDefinition[]
    eprDelta: number
    gradeBand: string
    userName: string
}

export class GamificationEngine {
    /**
     * Process a game result and update all gamification metrics
     */
    static async processResult(
        userId: string,
        result: {
            gameType: GameType
            score: number
            accuracy: number
            timeSpent: number
        },
        externalTx?: any // Prisma.TransactionClient (using any to avoid import issues for now, or I'll add import)
    ): Promise<GamificationResult> {
        const { score, accuracy, timeSpent } = result

        const execute = async (tx: any) => {
            // 1. Get current state
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { streakData: true }
            })

            if (!user) throw new Error('User not found')

            const oldXP = user.xp
            const oldLevel = calculateLevel(oldXP)

            // 2. Update Streak
            const streakUpdate = await this.updateStreak(tx, userId, user.streakData)
            const currentStreak = streakUpdate.currentStreak

            // 3. Calculate XP
            const xpEarned = calculateXP(score, accuracy, timeSpent, currentStreak)
            const newXP = oldXP + xpEarned
            const newLevel = calculateLevel(newXP)

            // 4. Calculate EPR Delta (Elo-style Rating)
            const oldEPR = user.epr || 1000
            const expectedAcc = 0.75 // System expects 75% accuracy
            const kFactor = 32

            let eprDelta = Math.round(kFactor * (accuracy - expectedAcc))

            // Bonus for mastery (speed + perfect)
            if (accuracy >= 0.95 && timeSpent < 15) {
                eprDelta += 10
            }

            // Floor absolute loss for psychological safety
            if (eprDelta < -15) eprDelta = -15

            const newEpr = Math.max(100, oldEPR + eprDelta)

            // 5. Update User record
            await tx.user.update({
                where: { id: userId },
                data: { xp: newXP, level: newLevel, epr: newEpr }
            })

            // 6. Check Badges/Achievements
            const newlyUnlockedBadges = await this.checkAchievements(tx, userId, {
                ...result,
                currentStreak
            })

            return {
                xpEarned,
                oldLevel,
                newLevel,
                levelUp: newLevel > oldLevel,
                currentStreak,
                newlyUnlockedBadges,
                userName: user.name ?? user.firstName ?? 'Unknown',
                gradeBand: user.gradeBand ?? 'BAND_2',
                eprDelta,
            }
        }

        const engineResult = externalTx
            ? await execute(externalTx)
            : await prisma.$transaction(execute)

        // ── Redis leaderboard update (outside transaction, non-blocking) ──────
        // Fire-and-forget: if Redis is down this silently warns, game result is unaffected.
        const { userName, ...gamificationResult } = engineResult as any
        incrementLeaderboardXP({
            studentId: userId,
            studentName: userName ?? 'Unknown',
            xpDelta: gamificationResult.xpEarned,
        }).catch((err: any) => console.warn('[engine] Leaderboard Redis update failed:', err))

        incrementEPR({
            studentId: userId,
            studentName: userName ?? 'Unknown',
            gradeBand: (engineResult as any).gradeBand,
            eprDelta: (engineResult as any).eprDelta,
        }).catch((err: any) => console.warn('[engine] EPR Redis update failed:', err))

        return gamificationResult
    }

    private static async updateStreak(tx: any, userId: string, streakData: any) {
        const now = new Date()
        // Standardize to UTC midnight for consistent daily reset
        const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

        if (!streakData) {
            return await tx.streak.create({
                data: {
                    studentId: userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastPlayedAt: now
                }
            })
        }

        const lastPlayed = new Date(streakData.lastPlayedAt)
        const lastPlayedUTC = Date.UTC(lastPlayed.getUTCFullYear(), lastPlayed.getUTCMonth(), lastPlayed.getUTCDate())

        const diffDays = Math.floor((todayUTC - lastPlayedUTC) / (1000 * 60 * 60 * 24))

        let newStreak = streakData.currentStreak
        if (diffDays === 1) {
            newStreak += 1
        } else if (diffDays > 1) {
            newStreak = 1
        }

        return await tx.streak.update({
            where: { studentId: userId },
            data: {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streakData.longestStreak),
                lastPlayedAt: now
            }
        })
    }

    private static async checkAchievements(
        tx: any,
        userId: string,
        context: {
            gameType: GameType
            score: number
            accuracy: number
            currentStreak: number
        }
    ): Promise<BadgeDefinition[]> {
        const unlocked: BadgeDefinition[] = []

        // 1. Get already unlocked achievements and total game count ONCE
        const [existingAchievements, totalGamesCount] = await Promise.all([
            tx.userAchievement.findMany({
                where: { userId },
                include: { achievement: true }
            }),
            tx.gameResult.count({ where: { studentId: userId } })
        ])

        const unlockedNames = new Set(existingAchievements.map((ua: any) => ua.achievement.name))
        const actualGameCount = totalGamesCount + 1 // +1 for the one being saved now

        let totalPendingXP = 0

        for (const badge of BADGE_DEFINITIONS) {
            if (unlockedNames.has(badge.id)) continue

            let meetsCondition = false
            const { type, value, gameType } = badge.condition

            switch (type) {
                case 'STREAK':
                    meetsCondition = context.currentStreak >= value
                    break
                case 'SCORE':
                    meetsCondition = context.score >= value
                    break
                case 'ACCURACY':
                    meetsCondition = context.accuracy >= value
                    break
                case 'SPECIFIC_GAME':
                    meetsCondition = context.gameType === gameType && context.score >= value
                    break
                case 'COUNT':
                    meetsCondition = actualGameCount >= value
                    break
            }

            if (meetsCondition) {
                // Ensure achievement existence in DB (lazy create if missing)
                const achievement = await tx.achievement.upsert({
                    where: { name: badge.id },
                    update: {},
                    create: {
                        name: badge.id,
                        description: badge.description,
                        icon: badge.icon,
                        xpReward: badge.xpReward,
                        rarity: badge.rarity,
                        category: badge.category,
                        condition: badge.condition as any
                    }
                })

                await tx.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id
                    }
                })

                totalPendingXP += badge.xpReward
                unlocked.push(badge)
            }
        }

        // 2. Batch User XP update if any achievements were unlocked
        if (totalPendingXP > 0) {
            await tx.user.update({
                where: { id: userId },
                data: { xp: { increment: totalPendingXP } }
            })
        }

        return unlocked
    }
}
