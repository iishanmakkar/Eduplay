import { NextResponse } from 'next/server'
import { metrics } from '@/lib/observability/metrics'

/**
 * GET /api/internal/metrics
 * 
 * Target endpoint for Prometheus or Datadog scrapers.
 * Protected by a static bearer token configured in ENV.
 */
export async function GET(req: Request) {
    // Basic security: require an internal metrics token
    const authHeader = req.headers.get('authorization')
    const configToken = process.env.METRICS_SCRAPE_TOKEN

    // If a token is configured, enforce it. Otherwise, return 404 to prevent leaks in prod
    // if ENV isn't set up.
    if (configToken) {
        if (authHeader !== `Bearer ${configToken}`) {
            return new NextResponse('Unauthorized', { status: 401 })
        }
    } else if (process.env.NODE_ENV === 'production') {
        // Safe fallback if ops forgot to set the token 
        return new NextResponse('Metrics token not configured', { status: 404 })
    }

    const payload = metrics.exportPrometheus()

    return new NextResponse(payload, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; version=0.0.4',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    })
}
