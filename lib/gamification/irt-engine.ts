/**
 * IRT Engine — Item Response Theory (3PL Model)
 * lib/gamification/irt-engine.ts
 *
 * IRT models the probability of a correct response as a function of:
 * - θ (theta): student ability estimate
 * - a: item discrimination (quality of differentiation)
 * - b: item difficulty (the 50% probability point)
 * - c: pseudo-guessing parameter (lower asymptote)
 *
 * 3PL Formula:
 * P(correct | θ) = c + (1 - c) * logistic(1.7 * a * (θ - b))
 *
 * Integration with BKT:
 * - BKT gives P(L): probability student has learned the skill
 * - IRT gives P(correct | θ): expected performance given ability
 * - Hybrid weight: finalMastery = α * BKT_pL + (1 - α) * IRT_ability
 *
 * Ability estimation uses Maximum Likelihood Estimation (simplified EAP).
 */

/** IRT item parameters — defaults calibrated from educational research */
export interface IRTItemParams {
    a: number  // Discrimination: 0.5 (low) – 2.5 (high). Default: 1.0
    b: number  // Difficulty: -3 (very easy) – 3 (very hard) in logit units
    c: number  // Pseudo-guessing: 0 (no guessing) – 0.35 (high). Default: 0.25 (4-choice MCQ)
}

export const IRT_DEFAULTS: IRTItemParams = { a: 1.0, b: 0.0, c: 0.25 }

/** Standard logistic function */
function logistic(x: number): number {
    return 1 / (1 + Math.exp(-x))
}

/**
 * 3-Parameter Logistic (3PL) IRT model.
 * Returns probability of correct response given student ability θ.
 */
export function irtProbability(theta: number, params: IRTItemParams = IRT_DEFAULTS): number {
    const { a, b, c } = params
    return c + (1 - c) * logistic(1.7 * a * (theta - b))
}

/**
 * Update student ability estimate using simplified EAP (Expected A Posteriori).
 * Uses a flat prior over θ ∈ [-4, 4], updating toward correct/incorrect.
 *
 * On correct answer: θ increases (gains discriminatory information toward harder items)
 * On incorrect answer: θ decreases
 *
 * Step size: learning rate 0.3 (conservative, prevents oscillation)
 */
const ABILITY_LEARNING_RATE = 0.3
const ABILITY_BOUNDS = { MIN: -4.0, MAX: 4.0 }

export function updateAbilityEstimate(
    currentTheta: number,
    isCorrect: boolean,
    itemParams: IRTItemParams = IRT_DEFAULTS
): number {
    const pCorrect = irtProbability(currentTheta, itemParams)
    // Gradient step: residual * discrimination * learning_rate
    const residual = (isCorrect ? 1 : 0) - pCorrect
    const newTheta = currentTheta + ABILITY_LEARNING_RATE * itemParams.a * residual
    return Math.min(Math.max(newTheta, ABILITY_BOUNDS.MIN), ABILITY_BOUNDS.MAX)
}

/**
 * Convert IRT ability θ to a mastery probability [0, 1].
 * Uses the logistic squash to normalize the unbounded ability scale.
 * θ=0 → 0.50, θ=2 → 0.86, θ=-2 → 0.14
 */
export function abilityToMasteryProbability(theta: number): number {
    return logistic(theta) // Simple logistic squash — no parameters needed
}

/**
 * Hybrid BKT + IRT mastery estimate.
 *
 * @param bktPL - BKT P(L): learning sequence-based mastery [0.01, 0.99]
 * @param theta - IRT ability estimate [-4, 4]
 * @param alpha - BKT weight (0.7 = trust BKT 70%, IRT 30%)
 * @returns Hybrid mastery probability [0, 1]
 */
export function hybridMastery(bktPL: number, theta: number, alpha = 0.7): number {
    const irtMastery = abilityToMasteryProbability(theta)
    return alpha * bktPL + (1 - alpha) * irtMastery
}

/**
 * Select next item difficulty for adaptive testing.
 * Chooses the item difficulty b that maximizes Fisher Information at current θ.
 * Fisher Information peaks at P(correct) ≈ 0.5, i.e., b ≈ θ.
 *
 * @param theta - Current student ability
 * @param availableDifficulties - Array of item b-parameters available
 * @returns The difficulty closest to optimal (b = θ)
 */
export function selectNextItemDifficulty(
    theta: number,
    availableDifficulties: number[] = [-2, -1, 0, 1, 2]
): number {
    // Optimal item: difficulty = current ability (50% success probability)
    return availableDifficulties.reduce((closest, b) =>
        Math.abs(b - theta) < Math.abs(closest - theta) ? b : closest
    )
}
