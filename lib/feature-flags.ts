/**
 * Feature Flag System — EduPlay Kill Switch
 * lib/feature-flags.ts
 *
 * Lightweight in-process feature flags with Redis override capability.
 * Flags can be toggled via /api/admin/feature-flags (OWNER only).
 *
 * Design decisions:
 * - Default values hardcoded (safe for cold start without Redis)
 * - Redis overrides checked at runtime (async)
 * - No external flag service dependency (reduces vendor surface)
 *
 * Usage:
 *   import { getFlag } from '@/lib/feature-flags'
 *   if (await getFlag('MULTIPLAYER_ENABLED')) { ... }
 */

import { redis } from '@/lib/cache/redis'

export type FeatureFlag =
    | 'MULTIPLAYER_ENABLED'       // Kill switch for multiplayer (match creation, leaderboard)
    | 'BKT_DECAY_ENABLED'         // Enable/disable forgetting curve (emergency toggle)
    | 'REDIS_LEADERBOARD_ENABLED' // Fall back to DB-only leaderboard if Redis has issues
    | 'FERPA_EXPORT_ENABLED'      // Enable/disable FERPA export API for maintenance
    | 'PER_SEAT_BILLING_ENABLED'  // Enable/disable per-seat surcharge in checkout
    | 'AI_IRT_WEIGHTING_ENABLED'  // Enable hybrid BKT+IRT adaptive difficulty
    | 'SPACED_REPETITION_ENABLED' // Enable SM-2 spaced repetition scheduling
    | 'REGION_ROUTING_ENABLED'    // Enable per-school region pinning

/** Default flag values — always safe to start with */
const DEFAULTS: Record<FeatureFlag, boolean> = {
    MULTIPLAYER_ENABLED: true,
    BKT_DECAY_ENABLED: true,
    REDIS_LEADERBOARD_ENABLED: true,
    FERPA_EXPORT_ENABLED: true,
    PER_SEAT_BILLING_ENABLED: true,
    AI_IRT_WEIGHTING_ENABLED: false,    // Gradual rollout — off by default
    SPACED_REPETITION_ENABLED: false,   // Gradual rollout — off by default
    REGION_ROUTING_ENABLED: false,      // Multi-region not yet live
}

const FLAG_KEY_PREFIX = 'feature_flag:'

/**
 * Get the current value of a feature flag.
 * Redis override takes priority; falls back to hardcoded default.
 */
export async function getFlag(flag: FeatureFlag): Promise<boolean> {
    if (!redis) return DEFAULTS[flag]

    try {
        const override = await redis.get(`${FLAG_KEY_PREFIX}${flag}`)
        if (override === null || override === undefined) return DEFAULTS[flag]
        return override === 'true' || override === true || override === 1
    } catch {
        return DEFAULTS[flag]
    }
}

/**
 * Set a feature flag override in Redis.
 * Persists across restarts. TTL = 90 days (prevents stale kills accumulating).
 */
export async function setFlag(flag: FeatureFlag, value: boolean): Promise<void> {
    if (!redis) throw new Error('Redis unavailable — cannot persist feature flag')
    await redis.set(`${FLAG_KEY_PREFIX}${flag}`, value ? 'true' : 'false', { ex: 90 * 24 * 60 * 60 })
}

/**
 * Get all feature flags with their current values (Redis + defaults composite).
 * Used by the admin dashboard.
 */
export async function getAllFlags(): Promise<Record<FeatureFlag, { value: boolean; source: 'redis' | 'default' }>> {
    const result = {} as Record<FeatureFlag, { value: boolean; source: 'redis' | 'default' }>

    for (const flag of Object.keys(DEFAULTS) as FeatureFlag[]) {
        let value = DEFAULTS[flag]
        let source: 'redis' | 'default' = 'default'

        if (redis) {
            try {
                const override = await redis.get(`${FLAG_KEY_PREFIX}${flag}`)
                if (override !== null && override !== undefined) {
                    value = override === 'true' || override === true || override === 1
                    source = 'redis'
                }
            } catch { /* ignore */ }
        }

        result[flag] = { value, source }
    }

    return result
}

/**
 * Reset a flag to its default (removes Redis override).
 */
export async function resetFlag(flag: FeatureFlag): Promise<void> {
    if (!redis) return
    await redis.del(`${FLAG_KEY_PREFIX}${flag}`)
}
