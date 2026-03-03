/**
 * A wrapper around native fetch that implements exponential backoff retry.
 * Useful for transient failures like 502/504 gateways during serverless cold starts.
 */
export async function fetchWithRetry(
    url: RequestInfo | URL,
    options?: RequestInit & { retries?: number; baseDelay?: number }
): Promise<Response> {
    const retries = options?.retries ?? 3
    const baseDelay = options?.baseDelay ?? 1000

    let attempt = 0
    let lastError: any

    while (attempt <= retries) {
        try {
            const response = await fetch(url, options)

            // Retry on Next.js / Serverless transient gateway errors
            if (!response.ok && [502, 503, 504].includes(response.status) && attempt < retries) {
                console.warn(`[fetch] Transient error ${response.status} on ${url}. Retrying... (${attempt + 1}/${retries})`)
                throw new Error(`Transient error ${response.status}`)
            }

            return response
        } catch (error: any) {
            lastError = error
            // Don't retry if it's the last attempt, or if it's an AbortError
            if (attempt === retries || error.name === 'AbortError') throw error

            const delay = baseDelay * Math.pow(2, attempt)
            console.warn(`[fetch] Attempt ${attempt + 1} failed for ${url}. Waiting ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
        attempt++
    }

    throw lastError
}
