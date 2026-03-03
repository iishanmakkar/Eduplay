/**
 * lib/deploy/feature-flags.ts
 *
 * PHASE 2 — Zero-Downtime Deployment
 *
 * Centralized feature flag evaluation. Enables graceful degradation, canary
 * rollouts (by user ID hash), and toggling new modules without redeploying.
 *
 * In highly scalable systems, this usually queries LaunchDarkly or Statsig via CDN edge.
 * For EduPlay's local Enterprise readiness, we simulate an edge-ready Config Store.
 */

// ── Feature Flag Definitions ────────────────────────────────────────────────

export type FeatureFlagName =
    | 'new_ai_eval_engine'
    | 'multiplayer_v2_sync'
    | 'advanced_teacher_dashboard'
    | 'experimental_bkt_algorithm'
    | 'beta_grade_reports'

interface FeatureConfig {
    enabledForEveryone: boolean
    rolloutPercentage: number // 0 to 100
    allowlist: string[]       // User IDs that always get it
    denylist: string[]        // User IDs that never get it
}

// ── In-Memory Configuration Store ───────────────────────────────────────────
// Defaults hardcoded, but struct ready to be synced from Redis/DB

const FEATURE_FLAGS: Record<FeatureFlagName, FeatureConfig> = {
    new_ai_eval_engine: {
        enabledForEveryone: false,
        rolloutPercentage: 25, // Canary rollout at 25%
        allowlist: [],
        denylist: []
    },
    multiplayer_v2_sync: {
        enabledForEveryone: false,
        rolloutPercentage: 0,
        allowlist: [],
        denylist: []
    },
    advanced_teacher_dashboard: {
        enabledForEveryone: true, // GA
        rolloutPercentage: 100,
        allowlist: [],
        denylist: []
    },
    experimental_bkt_algorithm: {
        enabledForEveryone: false,
        rolloutPercentage: 10, // Shadow testing on 10%
        allowlist: [],
        denylist: []
    },
    beta_grade_reports: {
        enabledForEveryone: false,
        rolloutPercentage: 0,
        allowlist: ['demo_teacher_123'], // Internal QA
        denylist: []
    }
}

// ── Evaluation Logic ───────────────────────────────────────────────────────

/**
 * Fast deterministic string hash function for bucketting user IDs
 * djb2 algorithm
 */
function hashString(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
    }
    return Math.abs(hash)
}

/**
 * Evaluates whether a feature is enabled for a given user.
 * 
 * @param feature The target feature flag.
 * @param userId (Optional) The user's ID for deterministic bucketting. If omitted, checks global enablement.
 */
export function isFeatureEnabled(feature: FeatureFlagName, userId?: string): boolean {
    const config = FEATURE_FLAGS[feature]
    if (!config) return false

    // Explicit deny takes highest precedence
    if (userId && config.denylist.includes(userId)) return false

    // Global override or explicit allow
    if (config.enabledForEveryone) return true
    if (userId && config.allowlist.includes(userId)) return true

    // Deterministic fractional rollout
    if (config.rolloutPercentage > 0 && userId) {
        // Hash the [userId + feature] to ensure the same user isn't in the rollout
        // bucket for every single feature inherently.
        const hash = hashString(`${userId}:${feature}`)
        // Modulo 100 gives deterministic bucket 0-99
        const bucket = hash % 100
        return bucket < config.rolloutPercentage
    }

    return false
}

/**
 * Useful fallback pattern for graceful degradation.
 * Evaluates the feature and runs the new callback if true, otherwise fallback.
 */
export async function withFeatureFlag<T>(
    feature: FeatureFlagName,
    userId: string | undefined,
    onEnabled: () => Promise<T> | T,
    onDisabled: () => Promise<T> | T
): Promise<T> {
    if (isFeatureEnabled(feature, userId)) {
        try {
            return await onEnabled()
        } catch (error) {
            console.warn(`[feature-flag] Fallback triggered due to error in new feature path (${feature})`)
            return await onDisabled()
        }
    }
    return await onDisabled()
}
