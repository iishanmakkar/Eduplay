/**
 * BKT Recalibration Cron — Monthly Forgetting Curve Batch Job
 * GET /api/cron/recalibrate-bkt
 *
 * Applies the Ebbinghaus forgetting curve to all UserSkillMastery records
 * where the student has been inactive for more than 30 days.
 *
 * Processing strategy:
 * - Batches of 100 records to avoid overwhelming the DB connection pool
 * - The @@index([userId, lastPracticedAt]) index makes this query efficient
 * - Runs monthly (on the 1st of each month via cron schedule)
 *
 * Registration in vercel.json / railway.json:
 *   { "path": "/api/cron/recalibrate-bkt", "schedule": "0 0 1 * *" }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyForgettingCurve, BKT_BOUNDS } from '@/lib/gamification/bkt-engine'
import { createCronLogger } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET
const BATCH_SIZE = 100
const INACTIVE_THRESHOLD_DAYS = 30

export async function GET(req: NextRequest) {
    // Verify cron secret to prevent unauthorized triggering
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('recalibrate-bkt')
    log.start({ batchSize: BATCH_SIZE, inactiveThresholdDays: INACTIVE_THRESHOLD_DAYS })

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_THRESHOLD_DAYS)

    let processed = 0
    let errors = 0
    let cursor: string | undefined = undefined

    try {
        // Enforce maximum P(L) bound for the entire table to prevent Bayesian division by zero.
        // This stops overfitted players from locking up the math engine.
        // BKT_BOUNDS.MAX is safely defined as 0.99
        await prisma.$executeRaw`
            UPDATE "UserSkillMastery"
            SET "masteryProbability" = ${BKT_BOUNDS.MAX}
            WHERE "masteryProbability" >= ${BKT_BOUNDS.MAX}
        `

        // Paginate through all stale skill mastery records
        while (true) {
            type SkillMasteryPage = { id: string; masteryProbability: number; lastPracticedAt: Date }[]
            const records: SkillMasteryPage = await prisma.userSkillMastery.findMany({
                where: { lastPracticedAt: { lt: cutoffDate } },
                take: BATCH_SIZE,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                orderBy: { id: 'asc' },
                select: { id: true, masteryProbability: true, lastPracticedAt: true },
            })

            if (records.length === 0) break
            cursor = records[records.length - 1].id

            // Compute decayed mastery for each record
            const updates = records.map((record: { id: string; masteryProbability: number; lastPracticedAt: Date }) => {
                const daysInactive = Math.floor(
                    (Date.now() - record.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24)
                )
                const decayedPL = applyForgettingCurve(record.masteryProbability, daysInactive)
                return { id: record.id, masteryProbability: decayedPL }
            })

            // Batch update — one query per batch (no N+1)
            await prisma.$transaction(
                updates.map((u: { id: string; masteryProbability: number }) =>
                    prisma.userSkillMastery.update({
                        where: { id: u.id },
                        data: { masteryProbability: u.masteryProbability },
                    })
                )
            )

            processed += records.length

            if (records.length < BATCH_SIZE) break // Last page
        }

        log.success({ processed, errors })
        return NextResponse.json({ success: true, processed, errors })

    } catch (error: any) {
        log.error(error, { processed, errors })
        return NextResponse.json({ success: false, error: error.message, processed }, { status: 500 })
    }
}
