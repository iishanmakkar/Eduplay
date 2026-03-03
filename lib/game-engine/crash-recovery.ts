/**
 * lib/game-engine/crash-recovery.ts
 *
 * Session checkpoint & restore for crash-safe game sessions.
 * Uses Redis with 30-minute TTL so players can resume after crashes/disconnects.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GameCheckpoint {
    sessionId: string
    userId: string
    gameKey: string
    score: number
    questionIndex: number
    streakCount: number
    difficulty: number
    startedAt: number  // epoch ms
    lastUpdatedAt: number
    answeredQuestionIds: string[]
    extraState?: Record<string, unknown>  // game-specific data
}

// ── Redis helpers ─────────────────────────────────────────────────────────────

async function getCache(): Promise<{
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, ttl: number) => Promise<void>
    del: (key: string) => Promise<void>
}> {
    try {
        if (!process.env.REDIS_URL) throw new Error('No REDIS_URL')
        // eslint-disable-next-line
        const redis = require('redis') as typeof import('redis')
        const client = redis.createClient({ url: process.env.REDIS_URL })
        await client.connect()
        return {
            get: (k) => client.get(k),
            set: async (k, v, ttl) => { await client.setEx(k, ttl, v) },
            del: async (k) => { await client.del(k) },
        }
    } catch {
        // In-memory fallback
        const mem = new Map<string, { val: string; exp: number }>()
        return {
            get: async (k) => {
                const e = mem.get(k)
                if (!e || Date.now() > e.exp) { mem.delete(k); return null }
                return e.val
            },
            set: async (k, v, ttl) => {
                mem.set(k, { val: v, exp: Date.now() + ttl * 1000 })
            },
            del: async (k) => { mem.delete(k) },
        }
    }
}

const CHECKPOINT_TTL = 30 * 60  // 30 minutes in seconds
const CHECKPOINT_PREFIX = 'checkpoint:'

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Save a game checkpoint to Redis.
 * Call after each correct/incorrect answer submission.
 */
export async function saveCheckpoint(checkpoint: GameCheckpoint): Promise<void> {
    const cache = await getCache()
    const key = `${CHECKPOINT_PREFIX}${checkpoint.sessionId}`
    checkpoint.lastUpdatedAt = Date.now()
    await cache.set(key, JSON.stringify(checkpoint), CHECKPOINT_TTL)
}

/**
 * Restore a game checkpoint by sessionId.
 * Returns null if expired or not found.
 */
export async function restoreCheckpoint(sessionId: string): Promise<GameCheckpoint | null> {
    const cache = await getCache()
    const key = `${CHECKPOINT_PREFIX}${sessionId}`
    const raw = await cache.get(key)
    if (!raw) return null
    try {
        return JSON.parse(raw) as GameCheckpoint
    } catch {
        return null
    }
}

/**
 * Delete a checkpoint on graceful session end.
 * Call when player finishes or explicitly exits.
 */
export async function cleanupCheckpoint(sessionId: string): Promise<void> {
    const cache = await getCache()
    await cache.del(`${CHECKPOINT_PREFIX}${sessionId}`)
}

/**
 * Create a fresh checkpoint for a new session.
 */
export function createCheckpoint(params: {
    sessionId: string
    userId: string
    gameKey: string
    difficulty?: number
}): GameCheckpoint {
    return {
        sessionId: params.sessionId,
        userId: params.userId,
        gameKey: params.gameKey,
        score: 0,
        questionIndex: 0,
        streakCount: 0,
        difficulty: params.difficulty ?? 2,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        answeredQuestionIds: [],
    }
}

/**
 * Update checkpoint after answering a question.
 */
export function advanceCheckpoint(
    checkpoint: GameCheckpoint,
    opts: {
        correct: boolean
        pointsEarned: number
        questionId: string
        newDifficulty: number
    }
): GameCheckpoint {
    return {
        ...checkpoint,
        score: checkpoint.score + opts.pointsEarned,
        questionIndex: checkpoint.questionIndex + 1,
        streakCount: opts.correct ? checkpoint.streakCount + 1 : 0,
        difficulty: opts.newDifficulty,
        answeredQuestionIds: [...checkpoint.answeredQuestionIds, opts.questionId],
        lastUpdatedAt: Date.now(),
    }
}
