import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

// Create a random in-memory backend for development/testing if no Redis credentials
const isDev = process.env.NODE_ENV !== 'production' || !process.env.UPSTASH_REDIS_REST_URL

const cache = new Map()

// Wrapper to handle Redis failures gracefully (Fail Open)
class SafeRatelimit {
    private limiter: any
    private fallbackLimit: number

    constructor(limiter: any, fallbackLimit: number) {
        this.limiter = limiter
        this.fallbackLimit = fallbackLimit
    }

    async limit(identifier: string) {
        try {
            return await this.limiter.limit(identifier)
        } catch (error) {
            console.error('Rate limit error (Safe Fallback):', error)
            // Fail open: Allow request if Redis is down
            return {
                success: true,
                limit: this.fallbackLimit,
                remaining: this.fallbackLimit - 1,
                reset: Date.now() + 60000
            }
        }
    }
}

export const rateLimit = {
    // 10 requests per 10 seconds for auth
    auth: isDev
        ? { limit: () => Promise.resolve({ success: true, limit: 10, remaining: 9, reset: Date.now() + 10000 }) }
        : new SafeRatelimit(new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, '10 s'),
            analytics: true,
            prefix: '@upstash/ratelimit',
        }), 10),

    // 100 requests per minute for API
    api: isDev
        ? { limit: () => Promise.resolve({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 }) }
        : new SafeRatelimit(new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(100, '1 m'),
            analytics: true,
            prefix: '@upstash/ratelimit',
        }), 100),

    // 5 requests per minute for expensive operations
    heavy: isDev
        ? { limit: () => Promise.resolve({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }) }
        : new SafeRatelimit(new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(5, '1 m'),
            analytics: true,
            prefix: '@upstash/ratelimit',
        }), 5),
}
