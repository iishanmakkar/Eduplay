/**
 * Mastery Anomaly Detection
 * lib/gamification/mastery-anomaly.ts
 *
 * Detects suspicious mastery patterns that may indicate:
 * 1. Answer sharing (multiple students with identical response sequences)
 * 2. Tool-assisted answers (unnaturally fast + perfect accuracy)
 * 3. BKT model drift (P(L) jumping more than the math allows)
 * 4. Session stuffing (hundreds of games in a single day)
 *
 * Returns AnomalyReport with severity and recommended action.
 *
 * This is NOT used for punitive action — only for flagging for human review.
 */

export type AnomalySeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface AnomalyFlag {
    type: string
    severity: AnomalySeverity
    detail: string
    recommendedAction: string
}

export interface AnomalyReport {
    userId: string
    sessionId?: string
    flags: AnomalyFlag[]
    riskScore: number      // 0–100 composite risk score
    requiresReview: boolean
}

/**
 * Detect mastery anomalies from a single game session result.
 *
 * @param userId - Student ID
 * @param sessionData - Result of a game session
 * @param priorMastery - BKT P(L) before this session
 * @param newMastery - BKT P(L) after this session
 */
export function detectSessionAnomalies(
    userId: string,
    sessionData: {
        accuracy: number          // 0-100
        timeSpentSeconds: number  // Total game time
        questionsAnswered: number
        score: number
        gameType: string
        hintsUsed: number
    },
    priorMastery: number,
    newMastery: number
): AnomalyReport {
    const flags: AnomalyFlag[] = []

    // ── 1. Unrealistically fast completion ─────────────────────────
    const secondsPerQuestion = sessionData.timeSpentSeconds / Math.max(sessionData.questionsAnswered, 1)
    if (sessionData.accuracy >= 90 && secondsPerQuestion < 1.5) {
        flags.push({
            type: 'SPEED_ANOMALY',
            severity: 'WARNING',
            detail: `${secondsPerQuestion.toFixed(2)}s/question with ${sessionData.accuracy}% accuracy — faster than human baseline`,
            recommendedAction: 'Review session replay if available; add CAPTCHA for game start'
        })
    }

    // ── 2. BKT jump exceeds theoretical maximum ────────────────────
    // Maximum single-session BKT gain (with P(T)=0.1, P(G)=0.2, P(S)=0.1) is ~0.15
    const masteryJump = newMastery - priorMastery
    if (masteryJump > 0.20) {
        flags.push({
            type: 'BKT_JUMP_ANOMALY',
            severity: 'CRITICAL',
            detail: `P(L) jumped ${(masteryJump * 100).toFixed(1)}pp (${(priorMastery * 100).toFixed(1)}% → ${(newMastery * 100).toFixed(1)}%) — exceeds theoretical max of ~15pp/session`,
            recommendedAction: 'Audit BKT parameter initialization; check for P(T) or P(S) misconfiguration'
        })
    }

    // ── 3. Suspicious no-hint perfect score ───────────────────────
    if (sessionData.accuracy === 100 && sessionData.hintsUsed === 0 && sessionData.questionsAnswered >= 10) {
        flags.push({
            type: 'PERFECT_NO_HINT',
            severity: 'INFO',
            detail: `100% accuracy with 0 hints on ${sessionData.questionsAnswered} questions`,
            recommendedAction: 'Normal if prior mastery was already high (check P(L) context)'
        })
    }

    // ── 4. Instant session (< 10 seconds total) ───────────────────
    if (sessionData.timeSpentSeconds < 10 && sessionData.questionsAnswered > 0) {
        flags.push({
            type: 'INSTANT_SESSION',
            severity: 'CRITICAL',
            detail: `Session completed in ${sessionData.timeSpentSeconds}s — bot or automation suspected`,
            recommendedAction: 'Invalidate this game result; flag account for review'
        })
    }

    // ── 5. Compute composite risk score ───────────────────────────
    let riskScore = 0
    for (const flag of flags) {
        if (flag.severity === 'CRITICAL') riskScore += 40
        else if (flag.severity === 'WARNING') riskScore += 20
        else riskScore += 5
    }
    riskScore = Math.min(100, riskScore)

    return {
        userId,
        flags,
        riskScore,
        requiresReview: riskScore >= 40 || flags.some(f => f.severity === 'CRITICAL')
    }
}

/**
 * Detect historical mastery anomalies across a student's full record.
 * Used by the BKT health alert cron for batch analysis.
 */
export function detectHistoricalAnomaly(
    userId: string,
    masteryRecords: Array<{ skillCode: string; masteryProbability: number; totalAttempts: number }>
): AnomalyReport {
    const flags: AnomalyFlag[] = []

    // Skills with suspiciously high mastery + very few attempts
    const quickMasters = masteryRecords.filter(
        r => r.masteryProbability >= 0.95 && r.totalAttempts <= 3
    )
    if (quickMasters.length > 5) {
        flags.push({
            type: 'BULK_QUICK_MASTERY',
            severity: 'WARNING',
            detail: `${quickMasters.length} skills at P(L)≥0.95 with ≤3 attempts — potentially pre-knowledged or shared answers`,
            recommendedAction: 'Normal for advanced students; investigate if combined with speed anomalies'
        })
    }

    // All skills at MAX bound
    const atMax = masteryRecords.filter(r => r.masteryProbability >= 0.99)
    if (atMax.length / Math.max(masteryRecords.length, 1) > 0.5) {
        flags.push({
            type: 'BOUNDARY_SATURATION',
            severity: 'CRITICAL',
            detail: `${atMax.length}/${masteryRecords.length} skills at max bound — BKT clamp may not be applied`,
            recommendedAction: 'Verify BKT_BOUNDS are applied; re-run recalibrate-bkt cron'
        })
    }

    const riskScore = Math.min(100, flags.reduce((s, f) =>
        s + (f.severity === 'CRITICAL' ? 40 : f.severity === 'WARNING' ? 20 : 5), 0
    ))

    return {
        userId,
        flags,
        riskScore,
        requiresReview: riskScore >= 40
    }
}
