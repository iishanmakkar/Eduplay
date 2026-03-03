/**
 * Adaptive Difficulty System
 * Adjusts game difficulty based on student performance
 */

import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export interface PerformanceMetrics {
    accuracy: number
    averageSpeed: number // seconds per question
    streak: number
    gamesPlayed: number
    lastPlayed: Date
}

export interface DifficultyRecommendation {
    currentLevel: 1 | 2 | 3 | 4
    recommendedLevel: 1 | 2 | 3 | 4
    reason: string
    shouldAdjust: boolean
    burnoutStatus: 'severe' | 'mild' | 'none'
}

export class AdaptiveDifficulty {
    /**
     * Analyze student performance and recommend difficulty
     */
    static async analyzePerformance(
        studentId: string,
        gameType: GameType
    ): Promise<DifficultyRecommendation> {
        // Get current difficulty level
        const progression = await prisma.difficultyProgression.findUnique({
            where: {
                userId_gameType: {
                    userId: studentId,
                    gameType
                }
            }
        })

        const validLevels = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3, 'CHALLENGE': 4 }
        const currentLevel = (validLevels[progression?.difficulty as keyof typeof validLevels] || 2) as 1 | 2 | 3 | 4

        // Get recent game results (last 10 sessions)
        const recentResults = await prisma.gameResult.findMany({
            where: {
                studentId,
                gameType
            },
            orderBy: {
                completedAt: 'desc'
            },
            take: 10
        })

        // Not enough data yet
        if (recentResults.length < 3) {
            return {
                currentLevel,
                recommendedLevel: currentLevel,
                reason: 'Not enough data yet. Keep playing!',
                shouldAdjust: false,
                burnoutStatus: 'none'
            }
        }

        // Calculate metrics
        const avgAccuracy = recentResults.reduce((sum, r) => sum + r.accuracy, 0) / recentResults.length
        const avgSpeed = recentResults.reduce((sum, r) => sum + r.timeSpent, 0) / recentResults.length
        const recentAccuracy = recentResults.slice(0, 3).reduce((sum, r) => sum + r.accuracy, 0) / 3

        // Detect burnout (last 3 sessions dropping below critical thresholds)
        let burnoutStatus: 'severe' | 'mild' | 'none' = 'none'
        if (recentResults.length >= 3) {
            const last3Acc = recentResults.slice(0, 3).reduce((sum, r) => sum + r.accuracy, 0) / 3
            if (last3Acc < 0.40) burnoutStatus = 'severe'
            else if (last3Acc < 0.60) burnoutStatus = 'mild'
        }

        // Determine if should increase difficulty
        if (await this.shouldIncreaseDifficultyWithMastery(studentId, gameType, avgAccuracy, recentAccuracy, currentLevel)) {
            const newLevel = Math.min(currentLevel + 1, 4) as 1 | 2 | 3 | 4
            return {
                currentLevel,
                recommendedLevel: newLevel,
                reason: `Great job! Your accuracy is ${Math.round(avgAccuracy * 100)}%. Ready for a challenge?`,
                shouldAdjust: true,
                burnoutStatus
            }
        }

        // Determine if should decrease difficulty
        if (this.shouldDecreaseDifficulty(avgAccuracy, recentAccuracy, currentLevel)) {
            const newLevel = Math.max(currentLevel - 1, 1) as 1 | 2 | 3 | 4
            return {
                currentLevel,
                recommendedLevel: newLevel,
                reason: `Let's try an easier level to build confidence. You've got this!`,
                shouldAdjust: true,
                burnoutStatus
            }
        }

        // Stay at current level
        return {
            currentLevel,
            recommendedLevel: currentLevel,
            reason: `Perfect! This difficulty level is just right for you.`,
            shouldAdjust: false,
            burnoutStatus
        }
    }

    /**
     * Should increase difficulty? — BKT-gated (Enterprise spec)
     * Requires BOTH accuracy ≥ 85% AND BKT P(L) ≥ 85%.
     * Accuracy alone can be gamed; BKT mastery is harder to fake.
     */
    static async shouldIncreaseDifficultyWithMastery(
        studentId: string,
        gameType: GameType,
        avgAccuracy: number,
        recentAccuracy: number,
        currentLevel: number
    ): Promise<boolean> {
        if (currentLevel >= 4) return false
        if (avgAccuracy < 0.85 || recentAccuracy < 0.85) return false
        try {
            const { BayesianKnowledgeTracing } = await import('@/lib/gamification/bkt-engine')
            const avgMastery: number | null =
                typeof (BayesianKnowledgeTracing as any).getAverageGameMastery === 'function'
                    ? await (BayesianKnowledgeTracing as any).getAverageGameMastery(studentId, String(gameType))
                    : null
            if (avgMastery === null) return true  // Cold start — allow on accuracy alone
            return avgMastery >= 0.85
        } catch {
            return avgAccuracy >= 0.85 && recentAccuracy >= 0.85
        }
    }

    /** @deprecated Use shouldIncreaseDifficultyWithMastery for mastery-gated promotion */
    private static shouldIncreaseDifficulty(
        avgAccuracy: number,
        recentAccuracy: number,
        currentLevel: number
    ): boolean {
        return (
            currentLevel < 4 &&
            avgAccuracy >= 0.85 &&
            recentAccuracy >= 0.85
        )
    }

    /**
     * Should decrease difficulty?
     * Criteria: <50% accuracy on last 3 sessions AND current level > 1
     */
    private static shouldDecreaseDifficulty(
        avgAccuracy: number,
        recentAccuracy: number,
        currentLevel: number
    ): boolean {
        return (
            currentLevel > 1 &&
            recentAccuracy < 0.50
        )
    }

    /**
     * Update difficulty progression in database
     */
    static async updateDifficulty(
        studentId: string,
        gameType: GameType,
        newLevel: 1 | 2 | 3 | 4
    ): Promise<void> {
        const difficultyMap: Record<1 | 2 | 3 | 4, string> = {
            1: 'EASY',
            2: 'MEDIUM',
            3: 'HARD',
            4: 'CHALLENGE'
        }
        const difficultyValue = difficultyMap[newLevel]

        await prisma.difficultyProgression.upsert({
            where: {
                userId_gameType: {
                    userId: studentId,
                    gameType
                }
            },
            update: {
                difficulty: difficultyValue,
                lastAdjustedAt: new Date()
            },
            create: {
                userId: studentId,
                gameType,
                difficulty: difficultyValue,
                lastAdjustedAt: new Date()
            }
        })
    }

    /**
     * Get difficulty configuration for game
     */
    static getDifficultyConfig(level: 1 | 2 | 3 | 4): {
        label: string
        description: string
        color: string
        timeMultiplier: number
        questionComplexity: string
    } {
        switch (level) {
            case 1:
                return {
                    label: 'Beginner',
                    description: 'Perfect for learning the basics',
                    color: '#10B981',
                    timeMultiplier: 1.5,
                    questionComplexity: 'simple'
                }
            case 2:
                return {
                    label: 'Intermediate',
                    description: 'Ready for a moderate challenge',
                    color: '#3B82F6',
                    timeMultiplier: 1.0,
                    questionComplexity: 'moderate'
                }
            case 3:
                return {
                    label: 'Advanced',
                    description: 'For experienced learners',
                    color: '#9333EA',
                    timeMultiplier: 0.8,
                    questionComplexity: 'complex'
                }
            case 4:
                return {
                    label: 'Challenge',
                    description: 'Ultimate test of mastery',
                    color: '#EF4444',
                    timeMultiplier: 0.6,
                    questionComplexity: 'expert'
                }
        }
    }

    /**
     * Get student's current difficulty for a game
     */
    static async getCurrentDifficulty(
        studentId: string,
        gameType: GameType
    ): Promise<1 | 2 | 3 | 4> {
        const progression = await prisma.difficultyProgression.findUnique({
            where: {
                userId_gameType: {
                    userId: studentId,
                    gameType
                }
            }
        })

        const validLevels: Record<string, 1 | 2 | 3 | 4> = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3, 'CHALLENGE': 4 }
        return (validLevels[progression?.difficulty ?? ''] ?? 2) as 1 | 2 | 3 | 4
    }

    /**
     * Personalization: Identify weak areas
     */
    static async identifyWeakAreas(studentId: string): Promise<{
        weakGames: Array<{ gameType: string; accuracy: number }>
        strongGames: Array<{ gameType: string; accuracy: number }>
        recommendations: string[]
    }> {
        // Get all game results
        const results = await prisma.gameResult.findMany({
            where: { studentId },
            orderBy: { completedAt: 'desc' },
            take: 100
        })

        // Group by game type
        const gameStats = results.reduce((acc: any, result) => {
            if (!acc[result.gameType]) {
                acc[result.gameType] = { total: 0, count: 0 }
            }
            acc[result.gameType].total += result.accuracy
            acc[result.gameType].count++
            return acc
        }, {})

        // Calculate averages
        const gameAverages = Object.entries(gameStats).map(([gameType, stats]: [string, any]) => ({
            gameType,
            accuracy: stats.total / stats.count
        }))

        // Sort by accuracy
        gameAverages.sort((a, b) => a.accuracy - b.accuracy)

        const weakGames = gameAverages.slice(0, 3)
        const strongGames = gameAverages.slice(-3).reverse()

        // Generate recommendations
        const recommendations = []
        if (weakGames.length > 0) {
            recommendations.push(`Practice ${weakGames[0].gameType} to improve accuracy`)
        }
        if (strongGames.length > 0) {
            recommendations.push(`Try challenge mode in ${strongGames[0].gameType}`)
        }

        return {
            weakGames,
            strongGames,
            recommendations
        }
    }
}
