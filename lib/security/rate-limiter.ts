/**
 * lib/security/rate-limiter.ts
 *
 * PHASE 5 — Advanced Rate Limiting & Abuse Prevention
 *
 * Implements sliding window rate limits via Redis (Upstash).
 * Covers: auth brute-force, AI endpoint spam, game submit throttle,
 * XP farming bots, per-user AND per-IP limits, 3-strike progressive ban.
 */

import { redis } from '@/lib/cache/redis'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number       // Unix ms timestamp
    retryAfter?: number // seconds to wait
    banned?: boolean
}

interface LimiterConfig {
    limit: number      // max requests
    window: number     // window in seconds
    banThreshold?: number  // bans after N violations
    banDuration?: number   // ban duration in seconds
}

// ── Core sliding window counter ───────────────────────────────────────────────

async function slidingWindow(
    key: string,
    config: LimiterConfig
): Promise<RateLimitResult> {
    const now = Date.now()
    const windowMs = config.window * 1000
    const windowStart = now - windowMs

    // Atomic pipeline: remove old, add current, count
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(key, '-inf', windowStart)
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    pipeline.zcard(key)
    pipeline.expire(key, config.window + 1)

    const results = await pipeline.exec() as Array<number | null>
    const count = (results[2] as number) ?? 0

    const remaining = Math.max(0, config.limit - count)
    const reset = now + windowMs

    if (count > config.limit) {
        // Track violation for progressive ban
        if (config.banThreshold) {
            await trackViolation(key, config.banThreshold, config.banDuration ?? 3600)
        }
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            reset,
            retryAfter: Math.ceil(config.window),
        }
    }

    return { success: true, limit: config.limit, remaining, reset }
}

// ── Progressive ban tracker ───────────────────────────────────────────────────

async function trackViolation(
    key: string,
    banAfterN: number,
    banDurationSec: number
): Promise<void> {
    const banKey = `ban:${key}`
    const strikes = await redis.incr(`strikes:${key}`)
    await redis.expire(`strikes:${key}`, 86400)  // reset strikes after 24h

    if (strikes >= banAfterN) {
        await redis.set(banKey, '1', { ex: banDurationSec })
        console.warn(`[security] Progressive ban activated: ${key} (${strikes} strikes)`)
    }
}

async function isBanned(key: string): Promise<boolean> {
    const banKey = `ban:${key}`
    const banned = await redis.get(banKey)
    return !!banned
}

// ── Endpoint-specific limiters ────────────────────────────────────────────────

export const securityRateLimiter = {

    /**
     * Auth endpoints: login, register, password reset
     * 10 attempts per IP per 15 minutes — brute-force protection
     */
    async auth(ip: string): Promise<RateLimitResult> {
        if (await isBanned(`auth:${ip}`)) {
            return { success: false, limit: 10, remaining: 0, reset: Date.now(), banned: true, retryAfter: 3600 }
        }
        return slidingWindow(`ratelimit:auth:${ip}`, {
            limit: 10, window: 900, banThreshold: 3, banDuration: 3600
        })
    },

    /**
     * AI generation: /api/ai-games/generate and subpaths
     * 30 requests per user per 10 minutes — prevents token cost abuse
     */
    async aiGenerate(userId: string): Promise<RateLimitResult> {
        if (await isBanned(`ai:${userId}`)) {
            return { success: false, limit: 30, remaining: 0, reset: Date.now(), banned: true, retryAfter: 3600 }
        }
        return slidingWindow(`ratelimit:ai:${userId}`, {
            limit: 30, window: 600, banThreshold: 5, banDuration: 3600
        })
    },

    /**
     * AI daily cost ceiling: 200 AI requests per user per 24 hours
     */
    async aiDailyCap(userId: string): Promise<RateLimitResult> {
        return slidingWindow(`ratelimit:ai_daily:${userId}`, {
            limit: 200, window: 86400
        })
    },

    /**
     * Game submit: /api/games/save-result
     * 60 submissions per user per hour — prevents XP farming
     */
    async gameSave(userId: string): Promise<RateLimitResult> {
        if (await isBanned(`gamesave:${userId}`)) {
            return { success: false, limit: 60, remaining: 0, reset: Date.now(), banned: true, retryAfter: 7200 }
        }
        return slidingWindow(`ratelimit:gamesave:${userId}`, {
            limit: 60, window: 3600, banThreshold: 3, banDuration: 7200
        })
    },

    /**
     * Answer submit: /api/games/submit/answer
     * 120 per user per minute — prevents rapid-fire bot attacks
     */
    async answerSubmit(userId: string): Promise<RateLimitResult> {
        return slidingWindow(`ratelimit:answer:${userId}`, {
            limit: 120, window: 60, banThreshold: 5, banDuration: 600
        })
    },

    /**
     * General API: all other /api routes
     * 300 per IP per minute
     */
    async api(ip: string): Promise<RateLimitResult> {
        return slidingWindow(`ratelimit:api:${ip}`, {
            limit: 300, window: 60
        })
    },

    /**
     * Multiplayer invite creation
     * 20 invites per user per hour
     */
    async multiplayerInvite(userId: string): Promise<RateLimitResult> {
        return slidingWindow(`ratelimit:invite:${userId}`, {
            limit: 20, window: 3600, banThreshold: 3, banDuration: 1800
        })
    },

    /**
     * Essay/debate evaluation (expensive AI calls)
     * 20 evaluations per user per hour
     */
    async aiEvaluate(userId: string): Promise<RateLimitResult> {
        return slidingWindow(`ratelimit:ai_eval:${userId}`, {
            limit: 20, window: 3600, banThreshold: 3, banDuration: 3600
        })
    },

    /**
     * Build standardized 429 response headers
     */
    build429Headers(result: RateLimitResult): Record<string, string> {
        return {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': (result.retryAfter ?? 60).toString(),
        }
    }
}
