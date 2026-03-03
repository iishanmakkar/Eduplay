/**
 * Spaced Repetition Scheduler — SM-2 Algorithm
 * lib/gamification/spaced-repetition.ts
 *
 * Based on SuperMemo SM-2 algorithm with EduPlay modifications:
 * - Integrated with BKT: interval scales with P(L), not just quality score
 * - Minimum interval: 1 day (no same-day re-exposure once seen)
 * - Maximum interval: 180 days (semi-annual ceiling for school context)
 * - Review items surface in the student's next session via priority queue
 *
 * Quality scores (0–5):
 * - 5: Perfect response immediately
 * - 4: Correct with minor hesitation
 * - 3: Correct with significant difficulty
 * - 2: Incorrect but recognized correct answer (near miss)
 * - 1: Incorrect, very difficult
 * - 0: Complete blackout
 */

export interface SpacedRepItem {
    skillCode: string
    interval: number        // Days until next review
    repetition: number     // Number of successful reviews
    efactor: number        // Ease Factor (2.5 default, 1.3 minimum)
    nextReviewAt: Date
    lastQuality: number    // Last quality score (0–5)
}

const SF_MIN = 1.3       // Minimum ease factor (prevents interval collapse)
const SF_DEFAULT = 2.5   // Default ease factor for new items
const INTERVAL_MIN = 1   // Minimum interval (days)
const INTERVAL_MAX = 180 // Maximum interval for school context

/**
 * Calculate next review schedule using SM-2 algorithm.
 * @param item - Current spaced rep state for the skill
 * @param quality - Response quality (0–5)
 * @param bktPL - BKT mastery probability [0.01, 0.99] for hybrid adjustment
 * @returns Updated spaced rep item
 */
export function sm2Update(
    item: SpacedRepItem,
    quality: number,
    bktPL = 0.5
): SpacedRepItem {
    const q = Math.max(0, Math.min(5, Math.round(quality)))

    // If quality < 3 (failed recall), reset repetition count
    if (q < 3) {
        const nextAt = new Date()
        nextAt.setDate(nextAt.getDate() + 1) // Try again tomorrow

        return {
            ...item,
            interval: 1,
            repetition: 0,
            efactor: item.efactor, // Don't reduce EF on first failure
            nextReviewAt: nextAt,
            lastQuality: q,
        }
    }

    // SM-2 EF update formula
    const newEF = Math.max(
        SF_MIN,
        item.efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    )

    // Interval calculation
    let newInterval: number
    if (item.repetition === 0) {
        newInterval = 1
    } else if (item.repetition === 1) {
        newInterval = 6
    } else {
        newInterval = Math.round(item.interval * newEF)
    }

    // BKT adjustment: high P(L) → extend interval (they really know it)
    // Low P(L) → compress interval (reinforce more often)
    const bktMultiplier = 0.5 + bktPL // [0.51, 1.49] range
    newInterval = Math.round(newInterval * bktMultiplier)

    // Clamp to school-appropriate bounds
    newInterval = Math.max(INTERVAL_MIN, Math.min(INTERVAL_MAX, newInterval))

    const nextAt = new Date()
    nextAt.setDate(nextAt.getDate() + newInterval)

    return {
        ...item,
        interval: newInterval,
        repetition: item.repetition + 1,
        efactor: newEF,
        nextReviewAt: nextAt,
        lastQuality: q,
    }
}

/**
 * Create a new spaced rep item for a skill (first encounter).
 */
export function createSpacedRepItem(skillCode: string): SpacedRepItem {
    const nextAt = new Date()
    nextAt.setDate(nextAt.getDate() + 1) // Review tomorrow after first exposure

    return {
        skillCode,
        interval: 1,
        repetition: 0,
        efactor: SF_DEFAULT,
        nextReviewAt: nextAt,
        lastQuality: -1, // Not yet answered
    }
}

/**
 * Get skills due for review today for a student.
 * @param items - All spaced rep items for the student
 * @param limit - Max skills to surface per session (default: 10)
 * @returns Skills due today, sorted by most overdue first
 */
export function getDueItems(items: SpacedRepItem[], limit = 10): SpacedRepItem[] {
    const now = new Date()
    return items
        .filter(item => item.nextReviewAt <= now)
        .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime())
        .slice(0, limit)
}

/**
 * Convert quality from game accuracy to SM-2 quality score.
 * @param accuracy - Game accuracy percentage [0, 100]
 * @param timeRatio - Time taken / target time [0, ∞]. 1.0 = exactly on time
 */
export function accuracyToQuality(accuracy: number, timeRatio = 1.0): number {
    if (accuracy >= 90 && timeRatio <= 1.0) return 5 // Perfect + fast
    if (accuracy >= 80 && timeRatio <= 1.2) return 4 // Good + acceptable speed
    if (accuracy >= 70) return 3                      // Correct but slow/difficult
    if (accuracy >= 50) return 2                      // Near miss
    if (accuracy >= 30) return 1                      // Mostly wrong
    return 0                                          // Near blackout
}
