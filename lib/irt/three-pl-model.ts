/**
 * lib/irt/three-pl-model.ts
 *
 * PHASE 1 — Three-Parameter Logistic (3PL) Item Response Theory Model
 *
 * P(correct | θ) = c + (1 - c) / (1 + exp(-a * (θ - b)))
 *
 * Parameters:
 *   θ (theta)  = student ability on a logit scale (typically -3 to +3)
 *   a          = discrimination: how sharply item separates ability levels (0.5–2.5)
 *   b          = difficulty: ability level at which P = (1+c)/2  (-3 to +3)
 *   c          = pseudo-guessing: lower asymptote (0 for constructed response, ~0.25 for 4-option MCQ)
 */

// ── Core IRT formula ──────────────────────────────────────────────────────────

/**
 * 3PL probability of a correct response.
 */
export function irt3PL(theta: number, a: number, b: number, c: number): number {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)))
}

/**
 * 1PL (Rasch) model — fixed a=1, c=0.
 */
export function irtRasch(theta: number, b: number): number {
    return irt3PL(theta, 1, b, 0)
}

/**
 * Item Information Function (IIF).
 * Higher information = the item better discriminates ability at θ.
 *
 * IIF = a² × [ (P - c)² / (1 - c)² ] × (1 - P) / P
 */
export function itemInformation(theta: number, a: number, b: number, c: number): number {
    const P = irt3PL(theta, a, b, c)
    const Q = 1 - P
    const PminusC = P - c
    const denom = (1 - c) ** 2
    return (a ** 2) * ((PminusC ** 2) / denom) * (Q / P)
}

/**
 * Test Information Function — sum of IIF across all items at θ.
 * Standard error of θ = 1 / sqrt( TIF(θ) )
 */
export function testInformation(theta: number, items: IRTParameters[]): number {
    return items.reduce((sum, item) => sum + itemInformation(theta, item.a, item.b, item.c), 0)
}

/**
 * Conditional Standard Error of Measurement at θ.
 */
export function csem(theta: number, items: IRTParameters[]): number {
    const tif = testInformation(theta, items)
    return tif > 0 ? 1 / Math.sqrt(tif) : Infinity
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IRTParameters {
    questionId: string
    a: number   // discrimination (default: 1.0)
    b: number   // difficulty (logit scale, -3 to +3)
    c: number   // pseudo-guessing (0 to 0.35)
}

export interface StudentAbility {
    userId: string
    skillTag: string
    theta: number         // current ability estimate
    thetaSE: number       // standard error of θ
    nItems: number        // number of items answered
    lastUpdated: Date
}

// ── Heuristic initialisation ──────────────────────────────────────────────────

/**
 * Convert a 1–5 difficultyTier into a calibrated a/b/c starting point.
 * These are reasonable priors; they converge to real estimates after ~30 attempts.
 */
export function heuristicIRTFromDifficulty(
    difficultyTier: number,
    optionCount = 4
): Pick<IRTParameters, 'a' | 'b' | 'c'> {
    // b: map 1→-2, 2→-1, 3→0, 4→+1, 5→+2
    const b = (difficultyTier - 3)
    // a: assumes moderate discrimination for all pre-calibration items
    const a = 1.0
    // c: typical guess probability for MCQ (1/optionCount discounted by 0.5)
    const c = Math.round((1 / optionCount) * 0.5 * 100) / 100
    return { a, b, c }
}

/**
 * Classify item quality by discrimination.
 * Lord (1980) thresholds.
 */
export function classifyItemQuality(a: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (a < 0.3) return 'poor'
    if (a < 0.7) return 'fair'
    if (a < 1.5) return 'good'
    return 'excellent'
}

// ── Item selection for adaptive tests ────────────────────────────────────────

/**
 * Maximum Information (Fisher) item selection.
 * Returns the index of the item that gives most info at current θ.
 * Standard in CAT (Computer Adaptive Testing).
 */
export function selectMaxInfoItem(
    theta: number,
    availableItems: IRTParameters[]
): number {
    let bestIdx = 0
    let bestInfo = -Infinity
    for (let i = 0; i < availableItems.length; i++) {
        const info = itemInformation(theta, availableItems[i].a, availableItems[i].b, availableItems[i].c)
        if (info > bestInfo) { bestInfo = info; bestIdx = i }
    }
    return bestIdx
}

// ── θ update (simplified EAP step) ───────────────────────────────────────────

/**
 * Update θ estimate after one response using a Newton-Raphson step
 * on the log-likelihood.
 *
 * Faster than full MLE for real-time adaptive testing.
 * Converges in 2–3 answers after good initialisation.
 */
export function updateThetaEAP(
    currentTheta: number,
    responses: { a: number; b: number; c: number; correct: boolean }[],
    priorMean = 0,
    priorSD = 1
): { theta: number; se: number } {
    // EAP: Expected A Posteriori over a normal prior
    // Implement as grid integration over θ ∈ [-4, +4]
    const GRID = 81
    const gridMin = -4, gridMax = 4
    const step = (gridMax - gridMin) / (GRID - 1)

    let sumW = 0
    let sumWTheta = 0
    const weights: number[] = []

    for (let i = 0; i < GRID; i++) {
        const t = gridMin + i * step
        // Prior: N(priorMean, priorSD²)
        const priorLogDensity = -0.5 * ((t - priorMean) / priorSD) ** 2
        // Likelihood: product of 3PL probabilities
        let logL = 0
        for (const r of responses) {
            const P = irt3PL(t, r.a, r.b, r.c)
            logL += r.correct ? Math.log(Math.max(P, 1e-10)) : Math.log(Math.max(1 - P, 1e-10))
        }
        const w = Math.exp(priorLogDensity + logL)
        weights.push(w)
        sumW += w
        sumWTheta += w * t
    }

    if (sumW < 1e-300) {
        // Degenerate posterior — return prior
        return { theta: priorMean, se: priorSD }
    }

    const theta = sumWTheta / sumW

    // Posterior variance
    let sumWVar = 0
    for (let i = 0; i < GRID; i++) {
        const t = gridMin + i * step
        sumWVar += weights[i] * (t - theta) ** 2
    }
    const posteriorVar = sumWVar / sumW
    const se = Math.sqrt(posteriorVar)

    return { theta, se }
}
