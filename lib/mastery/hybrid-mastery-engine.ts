/**
 * lib/mastery/hybrid-mastery-engine.ts
 *
 * PHASE 2 — Hybrid BKT + IRT Mastery Engine v3.0
 *
 * hybridMastery = 0.6 × BKT_masteryProbability + 0.4 × IRT_abilityConfidence
 *
 * Additional features:
 *  - Ability drift: θ decays toward the population mean over time
 *  - Forgetting decay: BKT mastery probability decays per Ebbinghaus curve
 *  - Confidence interval: θ ± 1.96 × SE
 *  - Mastery stability score: how consistently the student is above threshold
 */

import { irt3PL, updateThetaEAP, type IRTParameters, type StudentAbility } from '../irt/three-pl-model'

// ── Constants ─────────────────────────────────────────────────────────────────

const HYBRID_WEIGHT_BKT = 0.6
const HYBRID_WEIGHT_IRT = 0.4

// BKT parameters (population priors)
const BKT_P_INIT = 0.3          // P(initial mastery)
const BKT_P_LEARN = 0.2         // P(learn from wrong → right)
const BKT_P_FORGET_BASE = 0.05  // Base forgetting per session
const BKT_P_SLIP = 0.1          // P(slip: know but answer wrong)
const BKT_P_GUESS = 0.25        // P(guess: not know but answer right)

const MASTERY_THRESHOLD = 0.85   // θ equivalent above which student is "mastered"
const STABILITY_WINDOW = 5       // Number of consecutive responses to measure stability

// ── Forgetting curve (Ebbinghaus) ────────────────────────────────────────────

/**
 * Apply Ebbinghaus forgetting decay to BKT mastery probability.
 *
 * R(t) = e^(-t/S)   where t = days since last practice, S = memory strength
 *
 * Memory strength S increases with repetitions (PIMSLEUR approximation).
 */
export function applyForgettingDecay(
    masteryProb: number,
    daysSinceLastPractice: number,
    repetitionCount: number
): number {
    if (daysSinceLastPractice <= 0) return masteryProb
    // Memory strength grows with repetitions: S = 1 + 0.5 × log2(reps)
    const memoryStrength = Math.max(1, 1 + 0.5 * Math.log2(repetitionCount + 1))
    const retentionRate = Math.exp(-daysSinceLastPractice / (memoryStrength * 10))
    // Decayed mastery converges toward prior (BKT_P_INIT) at rate (1 - retention)
    return masteryProb * retentionRate + BKT_P_INIT * (1 - retentionRate)
}

/**
 * Predict optimal next review interval using SM-2-inspired formula.
 * Returns days until next practice for a given retention target.
 */
export function optimalReviewInterval(
    masteryProb: number,
    repetitionCount: number,
    targetRetention = 0.9
): number {
    const memoryStrength = Math.max(1, 1 + 0.5 * Math.log2(repetitionCount + 1))
    // Solve: targetRetention = exp(-t / (strength*10)) → t = -strength*10 * ln(target)
    const days = -memoryStrength * 10 * Math.log(targetRetention)
    return Math.max(1, Math.round(days * masteryProb))  // Scale by mastery: lower mastery → sooner review
}

// ── BKT Update ────────────────────────────────────────────────────────────────

/**
 * Standard BKT update step.
 * Returns new P(mastery) after observing a correct or incorrect response.
 */
export function bktUpdate(currentMastery: number, correct: boolean): number {
    // P(mastery | response) via Bayes
    const pKnowAndCorrect = currentMastery * (1 - BKT_P_SLIP)
    const pNotKnowAndCorrect = (1 - currentMastery) * BKT_P_GUESS
    const pKnowAndWrong = currentMastery * BKT_P_SLIP
    const pNotKnowAndWrong = (1 - currentMastery) * (1 - BKT_P_GUESS)

    let pKnowGivenObs: number
    if (correct) {
        const pObs = pKnowAndCorrect + pNotKnowAndCorrect
        pKnowGivenObs = pObs > 0 ? pKnowAndCorrect / pObs : currentMastery
    } else {
        const pObs = pKnowAndWrong + pNotKnowAndWrong
        pKnowGivenObs = pObs > 0 ? pKnowAndWrong / pObs : currentMastery
    }

    // Learning update
    return pKnowGivenObs + (1 - pKnowGivenObs) * BKT_P_LEARN
}

// ── IRT ability confidence mapper ────────────────────────────────────────────

/**
 * Convert θ and its SE to a [0,1] probability of being above mastery threshold.
 * Uses normal CDF approximation (logistic).
 */
function irtAbilityConfidence(theta: number, se: number, threshold = 0): number {
    // P(θ > threshold) under normal distribution
    // Logistic approximation of normal CDF: Phi(x) ≈ 1 / (1 + exp(-1.7 * x))
    const z = (theta - threshold) / Math.max(se, 0.01)
    return 1 / (1 + Math.exp(-1.7 * z))
}

// ── Hybrid Mastery ────────────────────────────────────────────────────────────

export interface HybridMasteryState {
    skillTag: string
    bktMastery: number          // 0–1 BKT probability
    irtTheta: number            // IRT ability estimate (logit)
    irtSE: number               // Standard error of θ
    irtAbilityConfidence: number // 0–1 probability above mastery threshold
    hybridScore: number          // 0–1 weighted combination
    confidenceInterval: [number, number]  // θ ± 1.96×SE
    masteryStability: number     // 0–1: fraction of recent responses above threshold
    masteryStatus: 'not_started' | 'learning' | 'approaching' | 'mastered' | 'advanced'
    daysSinceLastPractice: number
    optimalNextReviewDays: number
    repetitionCount: number
}

export interface ResponseRecord {
    questionId: string
    irtParams: IRTParameters
    correct: boolean
    timestampMs: number
}

/**
 * Compute hybrid mastery state from response history.
 */
export function computeHybridMastery(
    skillTag: string,
    responses: ResponseRecord[],
    lastPracticeDate?: Date
): HybridMasteryState {
    if (responses.length === 0) {
        return {
            skillTag,
            bktMastery: BKT_P_INIT,
            irtTheta: 0,
            irtSE: 1.0,
            irtAbilityConfidence: 0.5,
            hybridScore: BKT_P_INIT * HYBRID_WEIGHT_BKT + 0.5 * HYBRID_WEIGHT_IRT,
            confidenceInterval: [-1.96, 1.96],
            masteryStability: 0,
            masteryStatus: 'not_started',
            daysSinceLastPractice: 0,
            optimalNextReviewDays: 1,
            repetitionCount: 0,
        }
    }

    // BKT: sequential updates
    let bkt = BKT_P_INIT
    for (const r of responses) {
        bkt = bktUpdate(bkt, r.correct)
    }

    // Forgetting decay
    const days = lastPracticeDate
        ? Math.floor((Date.now() - lastPracticeDate.getTime()) / 86_400_000)
        : 0
    const decayedBkt = applyForgettingDecay(bkt, days, responses.length)

    // IRT: EAP θ estimation
    const irtResponses = responses.map(r => ({
        a: r.irtParams.a, b: r.irtParams.b, c: r.irtParams.c,
        correct: r.correct,
    }))
    const { theta, se } = updateThetaEAP(0, irtResponses)

    // IRT ability confidence (P(θ > 0) = P(above average))
    const abilityConf = irtAbilityConfidence(theta, se, 0)

    // Hybrid
    const hybrid = HYBRID_WEIGHT_BKT * decayedBkt + HYBRID_WEIGHT_IRT * abilityConf

    // Mastery stability: fraction of last STABILITY_WINDOW responses that were correct
    const recent = responses.slice(-STABILITY_WINDOW)
    const stability = recent.filter(r => r.correct).length / Math.max(1, recent.length)

    // Status classification
    let masteryStatus: HybridMasteryState['masteryStatus']
    if (responses.length === 0) masteryStatus = 'not_started'
    else if (hybrid < 0.4) masteryStatus = 'learning'
    else if (hybrid < 0.65) masteryStatus = 'approaching'
    else if (hybrid < 0.88) masteryStatus = 'mastered'
    else masteryStatus = 'advanced'

    return {
        skillTag,
        bktMastery: decayedBkt,
        irtTheta: Math.round(theta * 1000) / 1000,
        irtSE: Math.round(se * 1000) / 1000,
        irtAbilityConfidence: Math.round(abilityConf * 1000) / 1000,
        hybridScore: Math.round(hybrid * 1000) / 1000,
        confidenceInterval: [
            Math.round((theta - 1.96 * se) * 100) / 100,
            Math.round((theta + 1.96 * se) * 100) / 100,
        ],
        masteryStability: Math.round(stability * 100) / 100,
        masteryStatus,
        daysSinceLastPractice: days,
        optimalNextReviewDays: optimalReviewInterval(decayedBkt, responses.length),
        repetitionCount: responses.length,
    }
}

/**
 * Ability drift: pull θ toward population mean when inactive.
 * Returns adjusted θ after drift.
 */
export function applyAbilityDrift(
    theta: number,
    daysSinceActive: number,
    driftRate = 0.03,  // logit units per day toward mean
    populationMean = 0
): number {
    if (daysSinceActive <= 0) return theta
    const drift = driftRate * daysSinceActive
    // Move θ toward populationMean at driftRate per day
    return theta + (populationMean - theta) * Math.min(1, drift)
}

// ── Overconfidence detector ───────────────────────────────────────────────────

export interface OverconfidenceSignal {
    detected: boolean
    type: 'speed_guesser' | 'lucky_streak' | 'plateau' | 'none'
    confidence: number  // 0–1 how certain we are
    message: string
}

/**
 * Detect pathological response patterns.
 */
export function detectLearningPathology(
    responses: (ResponseRecord & { timeTakenMs: number })[],
    irtParams: IRTParameters[]
): OverconfidenceSignal {
    if (responses.length < 5) return { detected: false, type: 'none', confidence: 0, message: '' }

    const recent = responses.slice(-10)
    const avgTime = recent.reduce((s, r) => s + r.timeTakenMs, 0) / recent.length
    const correctRate = recent.filter(r => r.correct).length / recent.length

    // Speed guesser: answers very fast but correct rate near guessing level
    if (avgTime < 2000 && correctRate < 0.4) {
        return {
            detected: true, type: 'speed_guesser', confidence: 0.85,
            message: 'Rapid responses with low accuracy suggest guessing behaviour.'
        }
    }

    // Lucky streak: 5+ correct in a row for high-difficulty items
    const lastFive = responses.slice(-5)
    const allCorrect = lastFive.every(r => r.correct)
    const avgDiff = lastFive.reduce((s, r) => {
        const item = irtParams.find(p => p.questionId === r.questionId)
        return s + (item?.b ?? 0)
    }, 0) / 5
    if (allCorrect && avgDiff > 1.5) {
        return {
            detected: true, type: 'lucky_streak', confidence: 0.7,
            message: 'Consecutive correct on high-difficulty items — verify with harder items.'
        }
    }

    // Plateau: variance in correctness ≈ 0 over last 15 responses (not learning)
    if (responses.length >= 15) {
        const last15 = responses.slice(-15).map((r): number => r.correct ? 1 : 0)
        const mean = last15.reduce((a, b) => a + b, 0) / 15
        const variance = last15.reduce((s, x) => s + (x - mean) ** 2, 0) / 15
        if (variance < 0.05 && mean > 0.4 && mean < 0.6) {
            return {
                detected: true, type: 'plateau', confidence: 0.75,
                message: 'Performance has plateaued — student may benefit from different difficulty or topic.'
            }
        }
    }

    return { detected: false, type: 'none', confidence: 0, message: '' }
}
