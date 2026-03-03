/**
 * lib/ranking/elo-skill-rating.ts
 *
 * PHASE 5 — True Skill Ranking Intelligence System
 *
 * ELO-inspired Skill Rating:
 *  - Rating updates after each correct/incorrect response
 *  - Subject-specific ratings (not global XP)
 *  - Growth velocity score
 *  - Percentile computation from normal distribution assumption
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const ELO_K_FACTOR = 32          // Standard K-factor (higher = faster rating change)
const INITIAL_RATING = 1200      // Starting ELO for new students
const MIN_RATING = 400
const MAX_RATING = 3000

// Population distribution parameters (assumed normal)
const POP_MEAN = 1200
const POP_SD = 200               // 68% of students fall within ±200 ELO

// ── ELO core ─────────────────────────────────────────────────────────────────

/**
 * Expected score for a student against a question of a given difficulty rating.
 * Question rating derived from difficultyTier × 200 + base.
 */
export function expectedScore(studentRating: number, questionRating: number): number {
    return 1 / (1 + Math.pow(10, (questionRating - studentRating) / 400))
}

/**
 * Update student ELO rating after a single question response.
 * Score: 1 for correct, 0 for incorrect.
 */
export function updateELO(
    currentRating: number,
    questionRating: number,
    actualScore: 0 | 1,
    kFactor = ELO_K_FACTOR
): number {
    const expected = expectedScore(currentRating, questionRating)
    const newRating = currentRating + kFactor * (actualScore - expected)
    return Math.round(Math.max(MIN_RATING, Math.min(MAX_RATING, newRating)))
}

/**
 * Convert difficultyTier (1–5) to a question rating for ELO calculation.
 */
export function difficultyToQuestionRating(difficultyTier: number): number {
    // Tier 1 → 800, Tier 2 → 1000, Tier 3 → 1200, Tier 4 → 1400, Tier 5 → 1600
    return 800 + (difficultyTier - 1) * 200
}

// ── Percentile ranking ────────────────────────────────────────────────────────

/**
 * Compute percentile from ELO rating using normal CDF approximation.
 * Returns 0–100 percentile rank within the assumed population.
 */
export function ratingToPercentile(rating: number): number {
    const z = (rating - POP_MEAN) / POP_SD
    // Logistic approximation of normal CDF
    const cdf = 1 / (1 + Math.exp(-0.07056 * z ** 3 - 1.5976 * z))
    return Math.round(Math.max(1, Math.min(99, cdf * 100)))
}

/**
 * Convert percentile to a descriptive band.
 */
export function percentileToBand(percentile: number): {
    label: string
    tier: 'developing' | 'proficient' | 'advanced' | 'elite'
    color: string
} {
    if (percentile >= 95) return { label: 'Elite', tier: 'elite', color: '#f59e0b' }
    if (percentile >= 80) return { label: 'Advanced', tier: 'advanced', color: '#6366f1' }
    if (percentile >= 50) return { label: 'Proficient', tier: 'proficient', color: '#10b981' }
    return { label: 'Developing', tier: 'developing', color: '#64748b' }
}

// ── Subject-specific ratings ──────────────────────────────────────────────────

export interface SubjectRating {
    subject: string
    rating: number
    percentile: number
    band: ReturnType<typeof percentileToBand>
    gamesPlayed: number
    lastUpdated: Date
}

export interface StudentSkillProfile {
    userId: string
    overallRating: number
    overallPercentile: number
    overallBand: ReturnType<typeof percentileToBand>
    subjectRatings: SubjectRating[]
    growthVelocity: number        // ELO points gained per session (last 10 sessions)
    peakRating: number
    consistencyScore: number      // 0–1: low variance in recent results
}

/**
 * Compute growth velocity: average ELO delta per session over last N sessions.
 */
export function computeGrowthVelocity(ratingHistory: number[], windowSize = 10): number {
    if (ratingHistory.length < 2) return 0
    const window = ratingHistory.slice(-Math.min(windowSize, ratingHistory.length))
    const delta = window[window.length - 1] - window[0]
    return Math.round(delta / (window.length - 1))  // avg delta per session
}

/**
 * Consistency score: 1 - CV (coefficient of variation) of recent ratings.
 * High score = stable, predictable performance.
 */
export function computeConsistency(ratingHistory: number[]): number {
    if (ratingHistory.length < 3) return 0.5
    const recent = ratingHistory.slice(-10)
    const mean = recent.reduce((s, x) => s + x, 0) / recent.length
    const sd = Math.sqrt(recent.reduce((s, x) => s + (x - mean) ** 2, 0) / recent.length)
    const cv = sd / Math.max(1, mean)
    return Math.max(0, Math.min(1, Math.round((1 - cv * 5) * 100) / 100))
}

/**
 * Build a full student skill profile from subject rating histories.
 */
export function buildStudentSkillProfile(
    userId: string,
    subjectHistories: { subject: string; ratingHistory: number[]; gamesPlayed: number }[]
): StudentSkillProfile {
    const subjectRatings: SubjectRating[] = subjectHistories.map(s => {
        const rating = s.ratingHistory[s.ratingHistory.length - 1] ?? INITIAL_RATING
        const percentile = ratingToPercentile(rating)
        return {
            subject: s.subject,
            rating,
            percentile,
            band: percentileToBand(percentile),
            gamesPlayed: s.gamesPlayed,
            lastUpdated: new Date(),
        }
    })

    const allRatings = subjectRatings.map(s => s.rating)
    const overallRating = allRatings.length > 0
        ? Math.round(allRatings.reduce((a, b) => a + b) / allRatings.length)
        : INITIAL_RATING
    const overallPercentile = ratingToPercentile(overallRating)

    const allHistory = subjectHistories.flatMap(s => s.ratingHistory)
    const velocity = computeGrowthVelocity(allHistory)
    const consistency = computeConsistency(allHistory)
    const peak = allHistory.length > 0 ? Math.max(...allHistory) : INITIAL_RATING

    return {
        userId, overallRating, overallPercentile,
        overallBand: percentileToBand(overallPercentile),
        subjectRatings,
        growthVelocity: velocity,
        peakRating: peak,
        consistencyScore: consistency,
    }
}
