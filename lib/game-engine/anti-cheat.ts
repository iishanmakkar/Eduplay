/**
 * lib/game-engine/anti-cheat.ts
 *
 * Server-side anti-cheat protections:
 *  - PPS cap (points per second / submissions per second)
 *  - HMAC payload integrity check
 *  - Idempotent duplicate submission guard via Redis
 */

import crypto from 'crypto'

// ── Redis abstraction (wraps existing cache layer) ────────────────────────────
// Lazily loaded so this module works even without Redis in test environments
let redisClient: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, options?: { ex?: number; nx?: boolean }) => Promise<string | null>
    incr: (key: string) => Promise<number>
    expire: (key: string, seconds: number) => Promise<number>
} | null = null

async function getRedis() {
    if (!redisClient) {
        try {
            if (!process.env.REDIS_URL) throw new Error('No REDIS_URL')
            // eslint-disable-next-line
            const redis = require('redis') as typeof import('redis')
            const client = redis.createClient({ url: process.env.REDIS_URL })
            await client.connect()
            redisClient = {
                get: (k) => client.get(k),
                set: (k, v, opts) => client.set(k, v, opts as Parameters<typeof client.set>[2]),
                incr: (k) => client.incr(k),
                expire: (k, s) => client.expire(k, s),
            }
        } catch {
            // Redis unavailable — use in-memory fallback (single-instance only)
            const mem = new Map<string, { val: string; exp?: number }>()
            redisClient = {
                get: async (k) => {
                    const e = mem.get(k)
                    if (!e) return null
                    if (e.exp && Date.now() > e.exp) { mem.delete(k); return null }
                    return e.val
                },
                set: async (k, v, opts) => {
                    mem.set(k, { val: v, exp: opts?.ex ? Date.now() + opts.ex * 1000 : undefined })
                    return 'OK'
                },
                incr: async (k) => {
                    const e = mem.get(k)
                    const newVal = e ? parseInt(e.val) + 1 : 1
                    mem.set(k, { val: String(newVal), exp: e?.exp })
                    return newVal
                },
                expire: async (k, s) => {
                    const e = mem.get(k)
                    if (e) mem.set(k, { val: e.val, exp: Date.now() + s * 1000 })
                    return 1
                },
            }
        }
    }
    return redisClient
}

// ── PPS (Points Per Second / Submission Rate) cap ────────────────────────────

const MAX_SUBMISSIONS_PER_WINDOW = 5
const WINDOW_MS = 3000  // 5 submissions per 3 seconds max

export interface PPSCheckResult {
    allowed: boolean
    remaining: number
    retryAfterMs?: number
}

/**
 * Sliding window submission rate check.
 * Returns false if the user is submitting faster than MAX_SUBMISSIONS_PER_WINDOW/WINDOW_MS.
 */
export async function checkSubmissionRate(userId: string): Promise<PPSCheckResult> {
    const redis = await getRedis()
    const key = `pps:${userId}:${Math.floor(Date.now() / WINDOW_MS)}`

    const count = await redis.incr(key)
    if (count === 1) {
        await redis.expire(key, Math.ceil(WINDOW_MS / 1000) + 1)
    }

    if (count > MAX_SUBMISSIONS_PER_WINDOW) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: WINDOW_MS - (Date.now() % WINDOW_MS),
        }
    }

    return {
        allowed: true,
        remaining: MAX_SUBMISSIONS_PER_WINDOW - count,
    }
}

// ── Duplicate submission guard ────────────────────────────────────────────────

/**
 * Marks a submission as "in progress" using Redis SET NX (atomic).
 * Returns true if this is the FIRST submission for this key (proceed).
 * Returns false if a duplicate (reject).
 *
 * Key format: `dedup:{userId}:{questionId}:{matchId?}`
 */
export async function guardDuplicate(
    userId: string,
    questionId: string,
    matchId?: string,
    ttlSeconds = 30
): Promise<boolean> {
    const redis = await getRedis()
    const key = `dedup:${userId}:${questionId}:${matchId ?? 'solo'}`
    const result = await redis.set(key, '1', { ex: ttlSeconds, nx: true })
    return result === 'OK'  // null means key already existed → duplicate
}

// ── HMAC payload validation ───────────────────────────────────────────────────

const HMAC_ALGORITHM = 'sha256'

/**
 * Generate an HMAC signature for a submission payload.
 * Used client-side (in a trusted context) to sign the payload.
 *
 * @param payload  - The submission payload fields
 * @param secret   - Session-scoped secret (never the root secret)
 */
export function signPayload(
    payload: { questionId: string; userAnswer: string; timeTaken: number },
    secret: string
): string {
    const data = `${payload.questionId}:${payload.userAnswer}:${payload.timeTaken}`
    return crypto.createHmac(HMAC_ALGORITHM, secret).update(data).digest('hex')
}

/**
 * Server-side HMAC verification.
 * Constant-time comparison to prevent timing attacks.
 */
export function verifyPayloadHMAC(
    payload: { questionId: string; userAnswer: string; timeTaken: number },
    clientHmac: string,
    secret: string
): boolean {
    const expectedHmac = signPayload(payload, secret)
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedHmac, 'hex'),
            Buffer.from(clientHmac, 'hex')
        )
    } catch {
        return false  // buffer length mismatch = invalid HMAC format
    }
}

// ── Payload sanity guard ──────────────────────────────────────────────────────

export interface PayloadValidationResult {
    valid: boolean
    errors: string[]
}

/**
 * Validates submitted payload for basic data integrity before processing.
 * Does not verify correctness — just ensures no malformed/missing fields.
 */
export function validateSubmissionPayload(payload: {
    questionId?: unknown
    userAnswer?: unknown
    timeTaken?: unknown
}): PayloadValidationResult {
    const errors: string[] = []

    if (!payload.questionId || typeof payload.questionId !== 'string') {
        errors.push('questionId: required string')
    }
    if (typeof payload.userAnswer !== 'string') {
        errors.push('userAnswer: required string')
    }
    if (typeof payload.timeTaken !== 'number' || !isFinite(payload.timeTaken) || payload.timeTaken < 0) {
        errors.push('timeTaken: required non-negative finite number (ms)')
    }

    return { valid: errors.length === 0, errors }
}
