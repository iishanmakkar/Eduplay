import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MetricsService } from '@/lib/analytics/metrics-service'
import { redis } from '@/lib/cache/redis'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = Date.now()
        const WINDOW_MS = 5 * 60 * 1000 // 5m

        const [metrics, history, reqCount, errCount] = await Promise.all([
            MetricsService.getDashboardMetrics(),
            MetricsService.getMRRHistory(),
            redis.zcount('http_total', now - WINDOW_MS, now),
            redis.zcount('http_errors', now - WINDOW_MS, now)
        ])

        const errorRate = reqCount > 0 ? (errCount / reqCount) * 100 : 0

        return NextResponse.json({
            metrics,
            history,
            operationalHealth: {
                trailing5mRequests: reqCount,
                trailing5mErrors: errCount,
                errorRatePercent: errorRate.toFixed(2),
                availabilityStatus: errorRate < 0.1 ? 'GREEN' : errorRate < 3.0 ? 'YELLOW' : 'RED'
            }
        })
    } catch (error) {
        console.error('Failed to fetch metrics:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
