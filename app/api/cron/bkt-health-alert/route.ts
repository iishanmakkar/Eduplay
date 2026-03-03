import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCronLogger } from '@/lib/logger'

/**
 * BKT Health Alert Cron
 * Daily: detects students with stale BKT records or anomalous mastery
 * Flags records for recalibration and alerts if batch size exceeds thresholds
 * 
 * Schedule: 0 6 * * * (daily 6 AM UTC)
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('bkt-health-alert')
    log.start()

    try {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

        // 1. Stale records: not practiced in 30+ days but mastery still high
        const staleHighMastery = await prisma.userSkillMastery.count({
            where: {
                lastPracticedAt: { lt: thirtyDaysAgo },
                masteryProbability: { gte: 0.85 }
            }
        })

        // 2. Anomaly: mastery jumped from < 0.3 to > 0.95 in single session
        // Proxy: very high mastery + very few attempts (< 3 total)
        const suspiciouslyHighMastery = await prisma.userSkillMastery.count({
            where: {
                masteryProbability: { gte: 0.95 },
                totalAttempts: { lte: 3 }
            }
        })

        // 3. Dead records: last practiced > 90 days AND mastery > 0.50 (should have decayed)
        const undecayedStale = await prisma.userSkillMastery.count({
            where: {
                lastPracticedAt: { lt: ninetyDaysAgo },
                masteryProbability: { gte: 0.50 }
            }
        })

        // 4. Boundary violations (should be 0 always)
        const boundaryViolations = await prisma.userSkillMastery.count({
            where: {
                OR: [
                    { masteryProbability: { gte: 0.991 } },
                    { masteryProbability: { lte: 0.009 } }
                ]
            }
        })

        // 5. Total mastery records for reference
        const totalRecords = await prisma.userSkillMastery.count()

        // Alert levels
        const alerts: string[] = []

        if (boundaryViolations > 0) {
            alerts.push(`🔴 CRITICAL: ${boundaryViolations} mastery records outside safe bounds [0.01, 0.99]`)
        }
        if (staleHighMastery > totalRecords * 0.2) {
            alerts.push(`🟠 WARNING: ${staleHighMastery} stale high-mastery records not yet decayed (>${Math.round(staleHighMastery / totalRecords * 100)}% of total)`)
        }
        if (suspiciouslyHighMastery > 50) {
            alerts.push(`🟡 INFO: ${suspiciouslyHighMastery} records with P(L)≥0.95 in ≤3 attempts — possible anomaly`)
        }
        if (undecayedStale > 100) {
            alerts.push(`🟡 INFO: ${undecayedStale} records inactive 90+ days with P(L)≥0.50 — forgetting curve not applied`)
        }

        const sloBreached = boundaryViolations > 0

        log.success({
            totalRecords,
            staleHighMastery,
            suspiciouslyHighMastery,
            undecayedStale,
            boundaryViolations,
            sloBreached,
            alertCount: alerts.length
        })

        return NextResponse.json({
            success: true,
            sloBreached,
            totalRecords,
            metrics: { staleHighMastery, suspiciouslyHighMastery, undecayedStale, boundaryViolations },
            alerts,
            recommendation: undecayedStale > 100 ? 'Run recalibrate-bkt cron immediately' : null
        })

    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'BKT health check failed' }, { status: 500 })
    }
}
