/**
 * DB Health Check — Enterprise Observability Endpoint
 * GET /api/health/db
 *
 * Returns DB connectivity, query latency, active connection count, and pool pressure.
 * Used by load balancers, uptime monitors, and the owner dashboard.
 *
 * SLO alert thresholds:
 *   latencyMs > 200ms → alert: DB_LATENCY_HIGH
 *   connectionCount / MAX_DB_CONNECTIONS > 0.7 → alert: POOL_PRESSURE_HIGH
 */
import { NextResponse } from 'next/server'
import { prisma, MAX_DB_CONNECTIONS, DB_CONNECTION_WARN_THRESHOLD } from '@/lib/prisma'

interface ConnectionCountResult {
    count: bigint
}

export async function GET() {
    const start = Date.now()
    try {
        // 1. Lightweight connectivity probe
        await prisma.$queryRaw`SELECT 1`
        const latencyMs = Date.now() - start

        // 2. Active connection count from pg_stat_activity
        // Only runs in production where we have a real Postgres server
        let connectionCount: number | null = null
        let poolPressure: number | null = null
        const alerts: string[] = []

        if (process.env.NODE_ENV === 'production') {
            try {
                const result = await prisma.$queryRaw<ConnectionCountResult[]>`
                    SELECT count(*)::int AS count
                    FROM pg_stat_activity
                    WHERE datname = current_database()
                      AND state != 'idle'
                `
                connectionCount = Number(result[0]?.count ?? 0)
                poolPressure = connectionCount / MAX_DB_CONNECTIONS

                if (poolPressure > DB_CONNECTION_WARN_THRESHOLD) {
                    alerts.push('POOL_PRESSURE_HIGH')
                    console.warn(
                        `[health/db] Connection pool at ${Math.round(poolPressure * 100)}% ` +
                        `(${connectionCount}/${MAX_DB_CONNECTIONS})`
                    )
                }
            } catch {
                // pg_stat_activity may not be accessible on Neon — non-fatal
            }
        }

        if (latencyMs > 200) {
            alerts.push('DB_LATENCY_HIGH')
            console.warn(`[health/db] DB latency high: ${latencyMs}ms (SLO threshold: 200ms)`)
        }

        return NextResponse.json({
            status: alerts.length > 0 ? 'degraded' : 'healthy',
            database: 'connected',
            latencyMs,
            connectionCount,
            poolPressure: poolPressure !== null ? Math.round(poolPressure * 100) + '%' : null,
            maxConnections: MAX_DB_CONNECTIONS,
            alerts: alerts.length > 0 ? alerts : undefined,
            slo: { latencyThresholdMs: 200, poolWarnThreshold: '70%' },
            environment: process.env.NODE_ENV ?? 'unknown',
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        const latencyMs = Date.now() - start
        console.error('[health/db] Database health check failed:', error)
        return NextResponse.json(
            {
                status: 'unhealthy',
                database: 'disconnected',
                latencyMs,
                error: error?.message ?? 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        )
    }
}
