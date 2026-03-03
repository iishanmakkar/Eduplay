import { Redis } from '@upstash/redis/cloudflare'

// Enable local fallback if explicitly requested or running without prod keys
const isDev = process.env.NODE_ENV !== 'production' || !process.env.REDIS_URL

// Standard TTLs for safe cache invalidation
export const CACHE_TTL = {
    LEADERBOARD: 60 * 5, // 5 minutes
    USER_PROFILE: 60 * 60, // 1 hour
    GAME_SETTINGS: 60 * 60 * 24, // 1 day
}

// Instantiate with exponential backoff to prevent thundering herds on recovery
const upstashInstance = isDev
    ? null
    : new Redis({
        url: process.env.REDIS_URL!,
        token: process.env.REDIS_TOKEN || 'dummy',
        retry: {
            retries: 3,           // Up to 3 retries
            backoff: (retryCount) => Math.exp(retryCount) * 50, // 50ms, ~135ms, ~370ms
        }
    })

// Fallback proxy to ensure the entire application doesn't crash if Redis goes down
// Implements a "fail-open" cache strategy
export const redis = new Proxy(upstashInstance || {}, {
    get: function (target: any, prop: string) {
        if (isDev) {
            // Mock behaviors for local dev without redis
            if (prop === 'get') return async () => null;
            if (prop === 'set') return async () => 'OK';
            if (prop === 'del') return async () => 1;
            if (prop === 'zcount') return async () => 0;
            if (prop === 'incrbyfloat') return async () => 1.0;
            if (prop === 'pipeline') return () => ({
                zremrangebyscore: () => { },
                zadd: () => { },
                exec: async () => []
            })
            return async () => null;
        }

        // Production wrapper with fail-open
        return async (...args: any[]) => {
            try {
                if (typeof target[prop] === 'function') {
                    return await target[prop](...args)
                }
                return target[prop]
            } catch (error) {
                console.warn(`[Redis][Degradation] Operation ${prop} failed, falling back. Cause:`, error)
                // Return safe default returns based on common operations
                if (prop === 'get') return null
                if (prop === 'zcount') return 0
                if (prop === 'incrbyfloat') return args[1] // assume current incr value
                return null
            }
        }
    }
}) as unknown as Redis
