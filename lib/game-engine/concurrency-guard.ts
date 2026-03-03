/**
 * lib/game-engine/concurrency-guard.ts
 *
 * PHASES 5 + 8 — Multiplayer & Concurrent Submission Safety
 *
 * Provides:
 *  1. Idempotency key deduplication (prevents duplicate submissions)
 *  2. Atomic submission lock (memory-backed, Redis-ready)
 *  3. Race condition guard for concurrent session completions
 */

// ── In-memory idempotency store ───────────────────────────────────────────────
// Production: replace with Redis SETNX with TTL

const submittedKeys = new Map<string, { timestamp: number; result: unknown }>()
const SESSION_LOCKS = new Map<string, boolean>()
const IDEMPOTENCY_TTL_MS = 60_000  // 1 minute

function cleanupExpiredKeys() {
    const now = Date.now()
    for (const [key, val] of submittedKeys.entries()) {
        if (now - val.timestamp > IDEMPOTENCY_TTL_MS) submittedKeys.delete(key)
    }
}

// ── Idempotency guard ─────────────────────────────────────────────────────────

/**
 * Check if a submission with this idempotency key was already processed.
 * Returns cached result if duplicate, null if first-time.
 *
 * How to use:
 *   Client sends: idempotencyKey = `${sessionId}_${questionIndex}_${userId}`
 *   Server checks this before processing any submission.
 */
export function checkIdempotency(idempotencyKey: string): { isDuplicate: boolean; cachedResult?: unknown } {
    cleanupExpiredKeys()
    const existing = submittedKeys.get(idempotencyKey)
    if (existing) {
        console.warn(`[CONCURRENCY] Duplicate submission blocked: ${idempotencyKey}`)
        return { isDuplicate: true, cachedResult: existing.result }
    }
    return { isDuplicate: false }
}

/**
 * Record a processed submission to prevent future duplicates.
 */
export function recordSubmission(idempotencyKey: string, result: unknown): void {
    submittedKeys.set(idempotencyKey, { timestamp: Date.now(), result })
}

// ── Session completion lock ───────────────────────────────────────────────────

/**
 * Atomic session completion lock.
 * Only the first caller wins — subsequent calls are no-ops.
 * Critical for multiplayer: prevents double-completion of same match.
 */
export function acquireSessionLock(sessionId: string): boolean {
    if (SESSION_LOCKS.get(sessionId)) {
        console.warn(`[CONCURRENCY] Session ${sessionId} already completing — race condition blocked`)
        return false
    }
    SESSION_LOCKS.set(sessionId, true)
    // Auto-release after 30s in case of crash
    setTimeout(() => SESSION_LOCKS.delete(sessionId), 30_000)
    return true
}

/**
 * Release session lock (call after successful completion).
 */
export function releaseSessionLock(sessionId: string): void {
    SESSION_LOCKS.delete(sessionId)
}

// ── Multiplayer match completion transaction ──────────────────────────────────

export interface MatchResult {
    matchId: string
    winnerId: string | null
    player1Score: number
    player2Score: number
    completedAt: Date
    isDraw: boolean
}

/**
 * Atomic match completion — ensures only one winner is recorded
 * even if both players submit results simultaneously.
 *
 * Usage: call from server-side match completion API route.
 */
export async function atomicMatchComplete(
    matchId: string,
    player1: { userId: string; score: number },
    player2: { userId: string | null; score: number },
    persistFn: (result: MatchResult) => Promise<void>
): Promise<{ success: boolean; result?: MatchResult; error?: string }> {
    if (!acquireSessionLock(`match_${matchId}`)) {
        return { success: false, error: 'Match already completing — concurrent request blocked' }
    }

    try {
        const isDraw = player1.score === player2.score
        const winnerId = isDraw ? null : player1.score > player2.score ? player1.userId : (player2.userId ?? player1.userId)

        const result: MatchResult = {
            matchId,
            winnerId,
            player1Score: player1.score,
            player2Score: player2.score,
            completedAt: new Date(),
            isDraw,
        }

        await persistFn(result)
        releaseSessionLock(`match_${matchId}`)
        return { success: true, result }
    } catch (err) {
        releaseSessionLock(`match_${matchId}`)
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
}

// ── Adaptive test NaN / null guards ──────────────────────────────────────────

/**
 * Phase 6 — Sanitise IRT outputs before storing or rendering.
 * Prevents NaN θ, negative SE, undefined confidence interval.
 */
export interface SafeIRTResult {
    theta: number
    se: number
    confidenceInterval: [number, number]
    percentile: number
}

export function sanitiseIRTResult(
    theta: number | null | undefined,
    se: number | null | undefined
): SafeIRTResult {
    const safeTheta = (typeof theta === 'number' && isFinite(theta)) ? theta : 0
    const safeSE = (typeof se === 'number' && isFinite(se) && se > 0) ? se : 1.0

    // Normal CDF logistic approximation for percentile
    const z = safeTheta / safeSE
    const percentile = Math.round(Math.min(99, Math.max(1, (1 / (1 + Math.exp(-0.07056 * z ** 3 - 1.5976 * z))) * 100)))

    return {
        theta: Math.round(safeTheta * 1000) / 1000,
        se: Math.round(safeSE * 1000) / 1000,
        confidenceInterval: [
            Math.round((safeTheta - 1.96 * safeSE) * 100) / 100,
            Math.round((safeTheta + 1.96 * safeSE) * 100) / 100,
        ],
        percentile,
    }
}
