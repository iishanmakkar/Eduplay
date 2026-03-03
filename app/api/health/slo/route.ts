import { NextRequest, NextResponse } from 'next/server'
import { prismaReadonly as prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * SLO Violation Status Endpoint
 * Returns current SLO health status across all dimensions
 * Used by: external monitoring (UptimeRobot, BetterUptime), internal dashboards
 * 
 * GET /api/health/slo
 * Returns 200 if all SLOs green, 503 if any critical SLO breached
 */
export async function GET(req: NextRequest) {
    const startTime = Date.now()
    const violations: string[] = []
    const metrics: Record<string, any> = {}

    try {
        // ── 1. Database Latency SLO (p95 < 200ms) ─────────────────
        const dbStart = Date.now()
        await prisma.$queryRaw`SELECT 1`
        const dbLatency = Date.now() - dbStart
        metrics.dbLatencyMs = dbLatency
        if (dbLatency > 200) {
            violations.push(`DB_LATENCY: ${dbLatency}ms > 200ms SLO threshold`)
        }

        // ── 2. Webhook Failure Rate SLO (< 0.1%) ──────────────────
        const [totalWebhooks, failedWebhooks] = await Promise.all([
            (prisma.webhookEvent as any)?.count?.() ?? 0,
            (prisma.webhookEvent as any)?.count?.({ where: { status: 'DEAD' } }) ?? 0,
        ])
        const webhookFailureRate = totalWebhooks > 0 ? (failedWebhooks / totalWebhooks) * 100 : 0
        metrics.webhookFailureRate = webhookFailureRate.toFixed(3) + '%'
        metrics.deadWebhooks = failedWebhooks
        if (webhookFailureRate > 0.1) {
            violations.push(`WEBHOOK_FAILURE_RATE: ${webhookFailureRate.toFixed(3)}% > 0.1% SLO threshold`)
        }

        // ── 3. BKT Boundary SLO (0 boundary violations) ───────────
        const bktBoundaryViolations = await prisma.userSkillMastery.count({
            where: {
                OR: [
                    { masteryProbability: { gte: 0.991 } },
                    { masteryProbability: { lte: 0.009 } }
                ]
            }
        })
        metrics.bktBoundaryViolations = bktBoundaryViolations
        if (bktBoundaryViolations > 0) {
            violations.push(`BKT_BOUNDARY: ${bktBoundaryViolations} records outside safe [0.01, 0.99] bounds`)
        }

        // ── 4. Active Subscriptions Health ────────────────────────
        const activeSubscriptions = await prisma.subscription.count({
            where: { status: 'ACTIVE' }
        })
        metrics.activeSubscriptions = activeSubscriptions

        // ── 5. Overall Latency ─────────────────────────────────────
        const totalLatency = Date.now() - startTime
        metrics.totalHealthCheckMs = totalLatency
        if (totalLatency > 300) {
            violations.push(`API_LATENCY: health check itself took ${totalLatency}ms > 300ms SLO`)
        }

        const status = violations.length === 0 ? 'HEALTHY' : 'DEGRADED'
        const httpStatus = violations.length === 0 ? 200 : 503

        return NextResponse.json(
            {
                status,
                sloTargets: {
                    dbLatency: '< 200ms',
                    apiLatency: '< 300ms',
                    webhookFailureRate: '< 0.1%',
                    bktBoundaryViolations: '= 0',
                    availability: '99.9% uptime'
                },
                currentMetrics: metrics,
                violations,
                checkedAt: new Date().toISOString(),
            },
            { status: httpStatus }
        )

    } catch (error: any) {
        return NextResponse.json(
            {
                status: 'ERROR',
                error: error.message || 'SLO check failed',
                checkedAt: new Date().toISOString(),
            },
            { status: 503 }
        )
    }
}
