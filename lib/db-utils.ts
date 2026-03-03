/**
 * Safe database query wrapper to handle transient connection issues (OS 10054 / ConnectionReset)
 */
export async function safeDb<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn()
    } catch (error: any) {
        // Retry once for transient connection resets or P1001 errors
        if (error.code === 'P1001' || error.message?.includes('ConnectionReset') || error.message?.includes('10054')) {
            console.warn('Database ConnectionReset detected. Retrying DB operation...')
            try {
                return await fn()
            } catch (retryError) {
                console.error('Database retry failed:', retryError)
                throw new Error('Database temporarily unavailable. Please try again.')
            }
        }

        console.error('Database error:', error)
        throw error
    }
}

/**
 * Legacy alias for safeDb
 */
export const dbSafe = safeDb
