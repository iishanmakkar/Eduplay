/**
 * XP Calculation Utilities
 * Core business logic for experience points and leveling
 */

export interface GameResult {
    score: number
    accuracy: number
    timeSpent: number
    currentStreak?: number
}

/**
 * Calculate base XP from game performance
 * Formula: (score × 0.1) + (accuracy × 100)
 */
export function calculateBaseXP(score: number, accuracy: number): number {
    return Math.floor(score * 0.1 + accuracy * 100)
}

/**
 * Calculate streak multiplier
 * Formula: 1 + (streak × 0.1), max 2.5x at 15-day streak
 */
export function calculateStreakMultiplier(streak: number): number {
    const multiplier = 1 + streak * 0.1
    return Math.min(multiplier, 2.5)
}

/**
 * Calculate final XP with all bonuses
 */
export function calculateFinalXP(result: GameResult): number {
    const baseXP = calculateBaseXP(result.score, result.accuracy)
    const streakMultiplier = calculateStreakMultiplier(result.currentStreak || 0)
    return Math.floor(baseXP * streakMultiplier)
}

/**
 * Calculate level from total XP
 * 1000 XP per level
 */
export function calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 1000) + 1
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPToNextLevel(totalXP: number): number {
    const currentLevelXP = totalXP % 1000
    return 1000 - currentLevelXP
}

/**
 * Calculate progress percentage to next level
 */
export function calculateLevelProgress(totalXP: number): number {
    const currentLevelXP = totalXP % 1000
    return Math.floor((currentLevelXP / 1000) * 100)
}
