
import { redis } from './redis'

type CacheOptions = {
    ttl?: number // Time to live in seconds
}

export async function fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = { ttl: 60 }
): Promise<T> {
    // Try to get from cache
    try {
        const cached = await redis.get<T>(key)
        if (cached) {
            return cached
        }
    } catch (error) {
        console.warn(`Cache get failed for key ${key}:`, error)
    }

    // If not in cache, fetch fresh data
    const data = await fetchFn()

    // Save to cache
    try {
        if (data) {
            await redis.set(key, data, { ex: options.ttl ?? 60 })
        }
    } catch (error) {
        console.warn(`Cache set failed for key ${key}:`, error)
    }

    return data
}

export async function invalidateCache(pattern: string) {
    // Pattern invalidation is complex with Redis HTTP API, 
    // so we'll just implement simple key deletion for now if needed.
    // Or we can use keys() but it's expensive.
    // For this generic utility, we'll assume exact key or skip.
}
