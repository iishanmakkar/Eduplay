/**
 * lib/irt/calibration-pipeline.ts
 *
 * PHASE 3 — Item Calibration Pipeline
 *
 * When a question accumulates ≥ 1,000 attempts:
 *  1. Estimate empirical difficulty (p-value)
 *  2. Fit discrimination curve (biserial correlation proxy)
 *  3. Detect guessing probability
 *  4. Reassign difficultyTier
 *  5. Flag weak items (low discrimination)
 *  6. Archive items below quality threshold
 */

import { classifyItemQuality, type IRTParameters } from './three-pl-model'

export interface AttemptRecord {
    studentTheta: number    // θ estimate at time of attempt
    correct: boolean
    timeTakenMs: number
}

export interface CalibrationResult {
    questionId: string
    sampleSize: number
    empiricalDifficulty: number    // p-value: proportion correct (0–1)
    estimatedB: number             // IRT b-parameter (logit scale)
    estimatedA: number             // discrimination coefficient
    estimatedC: number             // guessing parameter
    newDifficultyTier: number      // 1–5
    itemQuality: 'poor' | 'fair' | 'good' | 'excellent'
    shouldArchive: boolean
    archiveReason?: string
    distractorBias?: 'top_heavy' | 'bottom_heavy' | 'balanced'
    calibrationConfidence: 'low' | 'medium' | 'high'  // based on n
}

// ── Minimum sample thresholds ─────────────────────────────────────────────────

const MIN_CALIBRATE = 50       // soft calibration (medium confidence)
const FULL_CALIBRATE = 1000    // full calibration (high confidence)
const ARCHIVE_A_THRESHOLD = 0.3  // items with a < 0.3 are removed

// ── Empirical b-parameter from p-value ───────────────────────────────────────

/**
 * Convert proportion correct (p-value) to logit-scale b estimate.
 * b ≈ -logit(p) = -ln(p/(1-p))
 *
 * This is approximate; proper IRT uses EM algorithm. This works well for
 * items where guessing is low (e.g., fill-in) and is a good starting point.
 */
function pValueToB(pValue: number): number {
    const clamped = Math.max(0.02, Math.min(0.98, pValue))
    return -Math.log(clamped / (1 - clamped))
}

/**
 * Convert logit b to difficultyTier 1–5.
 * b < -1.5 → 1, -1.5 to -0.5 → 2, -0.5 to 0.5 → 3, 0.5 to 1.5 → 4, > 1.5 → 5
 */
function bToDifficultyTier(b: number): number {
    if (b < -1.5) return 1
    if (b < -0.5) return 2
    if (b < 0.5) return 3
    if (b < 1.5) return 4
    return 5
}

// ── Point-biserial correlation proxy (discrimination) ────────────────────────

/**
 * Estimate discrimination using point-biserial correlation:
 * a_proxy = corr(correct, theta) × (P * Q)^0.5 / SD_scores
 *
 * This is the standard proxy before full EM calibration.
 */
function estimateDiscrimination(attempts: AttemptRecord[]): number {
    if (attempts.length < 10) return 1.0  // default

    const n = attempts.length
    const thetas = attempts.map(a => a.studentTheta)
    const scores = attempts.map((a): number => a.correct ? 1 : 0)

    const meanT = thetas.reduce((s, t) => s + t, 0) / n
    const meanS = scores.reduce((s, x) => s + x, 0) / n

    let covNum = 0, varT = 0, varS = 0
    for (let i = 0; i < n; i++) {
        covNum += (thetas[i] - meanT) * (scores[i] - meanS)
        varT += (thetas[i] - meanT) ** 2
        varS += (scores[i] - meanS) ** 2
    }

    if (varT < 1e-10 || varS < 1e-10) return 1.0  // no variance — default

    const r = covNum / Math.sqrt(varT * varS)
    // Scale to IRT a-range: biserial ≈ r * sqrt(n) / sqrt(p*q) roughly
    const pVal = meanS
    const biserial = Math.abs(r) * Math.sqrt(pVal * (1 - pVal)) / 0.3989  // 0.3989 ≈ φ(0)

    return Math.max(0, Math.min(3.0, biserial * 2))  // clamp to plausible range
}

// ── Guessing estimation ───────────────────────────────────────────────────────

/**
 * Estimate c (guessing) parameter by looking at very low-ability students.
 * P(correct | theta < -2) approximates c.
 */
function estimateGuessing(attempts: AttemptRecord[]): number {
    const lowAbility = attempts.filter(a => a.studentTheta < -1.5)
    if (lowAbility.length < 10) return 0.25  // default for MCQ

    const porrectLow = lowAbility.filter(a => a.correct).length / lowAbility.length
    return Math.max(0, Math.min(0.4, porrectLow))
}

// ── Main calibration function ─────────────────────────────────────────────────

export function calibrateItem(
    questionId: string,
    attempts: AttemptRecord[]
): CalibrationResult {
    const n = attempts.length
    const pValue = n > 0 ? attempts.filter(a => a.correct).length / n : 0.5

    const estimatedB = pValueToB(pValue)
    const estimatedA = n >= MIN_CALIBRATE ? estimateDiscrimination(attempts) : 1.0
    const estimatedC = n >= 50 ? estimateGuessing(attempts) : 0.25

    const newDifficultyTier = bToDifficultyTier(estimatedB)
    const itemQuality = classifyItemQuality(estimatedA)

    // Archive decision
    let shouldArchive = false
    let archiveReason: string | undefined

    if (estimatedA < ARCHIVE_A_THRESHOLD && n >= MIN_CALIBRATE) {
        shouldArchive = true
        archiveReason = `Low discrimination (a=${estimatedA.toFixed(2)} < ${ARCHIVE_A_THRESHOLD}) — item does not adequately differentiate ability levels`
    } else if (pValue > 0.97 && n >= MIN_CALIBRATE) {
        shouldArchive = true
        archiveReason = `Floor effect: ${(pValue * 100).toFixed(1)}% correct — item too easy for any meaningful discrimination`
    } else if (pValue < 0.03 && n >= MIN_CALIBRATE) {
        shouldArchive = true
        archiveReason = `Ceiling effect: only ${(pValue * 100).toFixed(1)}% correct — item may be ambiguous or incorrectly keyed`
    }

    // Distractor bias from time distribution proxy
    const avgTime = attempts.reduce((s, a) => s + a.timeTakenMs, 0) / n
    const medianTime = attempts.map(a => a.timeTakenMs).sort((a, b) => a - b)[Math.floor(n / 2)] ?? avgTime
    const distractorBias: CalibrationResult['distractorBias'] =
        avgTime > medianTime * 1.5 ? 'top_heavy' :
            avgTime < medianTime * 0.7 ? 'bottom_heavy' : 'balanced'

    const calibrationConfidence: CalibrationResult['calibrationConfidence'] =
        n >= FULL_CALIBRATE ? 'high' : n >= MIN_CALIBRATE ? 'medium' : 'low'

    return {
        questionId, sampleSize: n,
        empiricalDifficulty: Math.round(pValue * 1000) / 1000,
        estimatedB: Math.round(estimatedB * 1000) / 1000,
        estimatedA: Math.round(estimatedA * 1000) / 1000,
        estimatedC: Math.round(estimatedC * 1000) / 1000,
        newDifficultyTier,
        itemQuality, shouldArchive, archiveReason, distractorBias,
        calibrationConfidence,
    }
}

/**
 * Batch calibration result — processes all questions, returns archive list.
 */
export function runItemCalibration(
    items: { questionId: string; attempts: AttemptRecord[] }[]
): {
    results: CalibrationResult[]
    toArchive: string[]
    toUpgrade: { questionId: string; newTier: number; oldTier?: number }[]
    summary: { total: number; calibrated: number; archived: number; qualityDist: Record<string, number> }
} {
    const results = items.map(({ questionId, attempts }) => calibrateItem(questionId, attempts))
    const toArchive = results.filter(r => r.shouldArchive).map(r => r.questionId)
    const toUpgrade = results.filter(r => !r.shouldArchive).map(r => ({
        questionId: r.questionId,
        newTier: r.newDifficultyTier,
    }))

    const qualityDist = results.reduce((acc, r) => {
        acc[r.itemQuality] = (acc[r.itemQuality] ?? 0) + 1
        return acc
    }, {} as Record<string, number>)

    return {
        results,
        toArchive,
        toUpgrade,
        summary: { total: items.length, calibrated: results.filter(r => r.calibrationConfidence !== 'low').length, archived: toArchive.length, qualityDist },
    }
}
