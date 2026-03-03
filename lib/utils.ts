import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

/**
 * Calculate XP earned from a game with streak multiplier
 */
export function calculateXP(
    score: number,
    accuracy: number,
    timeSpent: number,
    currentStreak: number = 0
): number {
    // Base XP from score
    const baseXP = score * 0.1

    // Accuracy bonus (0-100 XP based on accuracy)
    const accuracyBonus = Math.floor(accuracy * 100)

    // Speed bonus (50 XP if completed in under 60 seconds)
    const speedBonus = timeSpent < 60 ? 50 : 0

    // Streak multiplier (retention mechanic)
    const streakMultiplier = calculateStreakMultiplier(currentStreak)

    // Total XP with streak multiplier
    const totalXP = Math.floor(
        (baseXP + accuracyBonus + speedBonus) * streakMultiplier
    )

    return Math.max(totalXP, 10) // Minimum 10 XP
}

/**
 * Calculate streak multiplier for XP boost
 */
export function calculateStreakMultiplier(streak: number): number {
    if (streak >= 30) return 2.5  // 30+ days: 2.5x
    if (streak >= 14) return 2.0  // 14-29 days: 2x
    if (streak >= 7) return 1.5   // 7-13 days: 1.5x
    return 1.0                     // 0-6 days: 1x
}

export function calculateLevel(totalXP: number): number {
    // Level formula: level = floor(sqrt(XP / 100))
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

export function getXPForNextLevel(currentLevel: number): number {
    return (currentLevel ** 2) * 100
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
}

export function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(date)
}

export function getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}
