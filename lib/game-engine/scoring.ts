/**
 * Smart Scoring Engine
 * Calculates XP based on multiple factors with multipliers
 */

export interface ScoringFactors {
    baseScore: number
    accuracy: number // 0-1
    timeSpent: number // seconds
    expectedTime: number // seconds
    streak: number // consecutive correct answers
    hintsUsed: number
    mistakes: number
    difficulty: 1 | 2 | 3 | 4
    perfectRound?: boolean
}

export interface ScoringResult {
    totalXP: number
    breakdown: {
        base: number
        speedBonus: number
        accuracyMultiplier: number
        streakMultiplier: number
        difficultyBonus: number
        hintPenalty: number
        mistakePenalty: number
        perfectBonus: number
    }
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
    message: string
}

export class ScoringEngine {
    /**
     * Calculate total XP with all factors
     */
    static calculateXP(factors: ScoringFactors): ScoringResult {
        const {
            baseScore,
            accuracy,
            timeSpent,
            expectedTime,
            streak,
            hintsUsed,
            mistakes,
            difficulty,
            perfectRound = false
        } = factors

        // Base XP
        const base = baseScore

        // Speed Bonus: faster = more XP (up to +50%)
        const speedBonus = this.getSpeedBonus(timeSpent, expectedTime, base)

        // Accuracy Multiplier: 1x to 2x
        const accuracyMultiplier = this.getAccuracyMultiplier(accuracy)

        // Streak Multiplier: combo system
        const streakMultiplier = this.getStreakMultiplier(streak)

        // Difficulty Bonus
        const difficultyBonus = this.getDifficultyBonus(difficulty, base)

        // Penalties
        const hintPenalty = hintsUsed * 50
        const mistakePenalty = mistakes * 30

        // Perfect Round Bonus
        const perfectBonus = perfectRound ? base * 0.5 : 0

        // Calculate total
        let totalXP = base
        totalXP += speedBonus
        totalXP *= accuracyMultiplier
        totalXP *= streakMultiplier
        totalXP += difficultyBonus
        totalXP -= hintPenalty
        totalXP -= mistakePenalty
        totalXP += perfectBonus

        // Ensure minimum XP
        totalXP = Math.max(Math.round(totalXP), 10)

        // Calculate grade
        const grade = this.calculateGrade(accuracy, timeSpent, expectedTime)

        // Generate message
        const message = this.generateMessage(grade, accuracy, streak)

        return {
            totalXP,
            breakdown: {
                base,
                speedBonus: Math.round(speedBonus),
                accuracyMultiplier,
                streakMultiplier,
                difficultyBonus: Math.round(difficultyBonus),
                hintPenalty,
                mistakePenalty,
                perfectBonus: Math.round(perfectBonus)
            },
            grade,
            message
        }
    }

    /**
     * Speed Bonus: Faster completion = more XP
     * Up to +50% for being 2x faster
     */
    private static getSpeedBonus(timeSpent: number, expectedTime: number, baseScore: number): number {
        if (timeSpent >= expectedTime) return 0

        const speedRatio = timeSpent / expectedTime
        const bonusPercent = Math.min((1 - speedRatio) * 0.5, 0.5) // Max 50%

        return baseScore * bonusPercent
    }

    /**
     * Accuracy Multiplier: 1x to 2x
     * 100% accuracy = 2x
     * 80% accuracy = 1.6x
     * 50% accuracy = 1x
     */
    private static getAccuracyMultiplier(accuracy: number): number {
        return 1 + Math.max(accuracy - 0.5, 0) * 2
    }

    /**
     * Streak Multiplier: Combo system
     * 1-2 correct: 1x
     * 3-5 correct: 1.2x
     * 6-9 correct: 1.5x
     * 10+ correct: 2x
     */
    private static getStreakMultiplier(streak: number): number {
        if (streak >= 10) return 2.0
        if (streak >= 6) return 1.5
        if (streak >= 3) return 1.2
        return 1.0
    }

    /**
     * Get combo level for UI display
     */
    static getComboLevel(streak: number): {
        level: number
        multiplier: number
        label: string
        color: string
    } {
        if (streak >= 10) {
            return { level: 4, multiplier: 2.0, label: 'LEGENDARY!', color: '#FFD700' }
        }
        if (streak >= 6) {
            return { level: 3, multiplier: 1.5, label: 'AMAZING!', color: '#9333EA' }
        }
        if (streak >= 3) {
            return { level: 2, multiplier: 1.2, label: 'GREAT!', color: '#3B82F6' }
        }
        return { level: 1, multiplier: 1.0, label: 'NICE!', color: '#10B981' }
    }

    /**
     * Difficulty Bonus
     */
    private static getDifficultyBonus(difficulty: 1 | 2 | 3 | 4, baseScore: number): number {
        const bonusPercent = {
            1: 0,    // Beginner: no bonus
            2: 0.2,  // Intermediate: +20%
            3: 0.5,  // Advanced: +50%
            4: 1.0   // Challenge: +100%
        }[difficulty]

        return baseScore * bonusPercent
    }

    /**
     * Calculate performance grade
     */
    private static calculateGrade(
        accuracy: number,
        timeSpent: number,
        expectedTime: number
    ): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
        const speedRatio = timeSpent / expectedTime

        // S rank: 95%+ accuracy and fast
        if (accuracy >= 0.95 && speedRatio <= 0.8) return 'S'

        // A rank: 90%+ accuracy
        if (accuracy >= 0.9) return 'A'

        // B rank: 80%+ accuracy
        if (accuracy >= 0.8) return 'B'

        // C rank: 70%+ accuracy
        if (accuracy >= 0.7) return 'C'

        // D rank: 60%+ accuracy
        if (accuracy >= 0.6) return 'D'

        // F rank: below 60%
        return 'F'
    }

    /**
     * Generate encouraging message
     */
    private static generateMessage(grade: string, accuracy: number, streak: number): string {
        if (grade === 'S') {
            return ['PERFECT! You\'re unstoppable! 🌟', 'LEGENDARY PERFORMANCE! 🏆', 'FLAWLESS VICTORY! ⭐'][Math.floor(Math.random() * 3)]
        }
        if (grade === 'A') {
            return ['EXCELLENT WORK! 🎉', 'OUTSTANDING! Keep it up! 💪', 'AMAZING JOB! 🚀'][Math.floor(Math.random() * 3)]
        }
        if (grade === 'B') {
            return ['GREAT JOB! 👍', 'WELL DONE! 🎯', 'NICE WORK! ✨'][Math.floor(Math.random() * 3)]
        }
        if (grade === 'C') {
            return ['GOOD EFFORT! 💫', 'KEEP PRACTICING! 📚', 'YOU\'RE IMPROVING! 📈'][Math.floor(Math.random() * 3)]
        }
        if (grade === 'D') {
            return ['KEEP TRYING! 🌱', 'PRACTICE MAKES PERFECT! 💪', 'YOU CAN DO IT! 🎯'][Math.floor(Math.random() * 3)]
        }
        return ['TRY AGAIN! 🔄', 'KEEP LEARNING! 📖', 'DON\'T GIVE UP! 💪'][Math.floor(Math.random() * 3)]
    }

    /**
     * Calculate expected time based on question count and difficulty
     */
    static calculateExpectedTime(questionCount: number, difficulty: 1 | 2 | 3 | 4): number {
        const baseTimePerQuestion = {
            1: 20,  // 20 seconds per question (beginner)
            2: 15,  // 15 seconds per question (intermediate)
            3: 12,  // 12 seconds per question (advanced)
            4: 10   // 10 seconds per question (challenge)
        }[difficulty]

        return questionCount * baseTimePerQuestion
    }
}
