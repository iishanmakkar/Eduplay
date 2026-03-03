import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCronLogger } from '@/lib/logger'
import { redis } from '@/lib/cache/redis'

/**
 * Leaderboard Integrity Validation Cron
 * Weekly: compare Redis sorted set totals with DB aggregates
 * Detects drift between Redis and DB and auto-heals by resetting Redis from DB
 * 
 * Schedule: 0 2 * * 0 (Sunday 2 AM UTC)
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('leaderboard-validation')
    log.start()

    try {
        // Get current week start
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setUTCHours(0, 0, 0, 0)
        weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay()) // Sunday
        const weekKey = `leaderboard:${weekStart.toISOString().split('T')[0]}`

        // DB aggregate: total XP earned this week from Leaderboard table
        const dbLeaderboard = await prisma.leaderboard.findMany({
            where: {
                weekStart: {
                    gte: weekStart,
                    lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                }
            },
            select: { studentId: true, weeklyXP: true },
            orderBy: { weeklyXP: 'desc' },
            take: 100
        })

        const dbTotal = dbLeaderboard.reduce((sum, r) => sum + r.weeklyXP, 0)

        // Redis aggregate
        let redisTotal = 0
        let driftDetected = false
        let healed = false

        if (redis) {
            try {
                const redisMembers = await (redis as any).zrange(weekKey, 0, 99, { rev: true, withScores: true })
                if (Array.isArray(redisMembers)) {
                    // Upstash returns [member, score, member, score, ...]
                    for (let i = 1; i < redisMembers.length; i += 2) {
                        redisTotal += Number(redisMembers[i])
                    }
                }

                // Compare — allow 5% drift tolerance
                const driftPercent = dbTotal > 0 ? Math.abs(redisTotal - dbTotal) / dbTotal * 100 : 0

                if (driftPercent > 5 && dbLeaderboard.length > 0) {
                    driftDetected = true
                    // Heal: rebuild Redis from DB
                    await (redis as any).del(weekKey)
                    for (const entry of dbLeaderboard) {
                        const user = await prisma.user.findUnique({
                            where: { id: entry.studentId },
                            select: { firstName: true, lastName: true }
                        })
                        const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'
                        await (redis as any).zadd(weekKey, { score: entry.weeklyXP, member: `${entry.studentId}:${name}` })
                    }
                    // Re-set 8-day TTL
                    await (redis as any).expire(weekKey, 8 * 24 * 60 * 60)
                    healed = true
                }

            } catch (redisErr) {
                // Redis unavailable — log but don't fail the cron
                log.error(redisErr)
            }
        }

        log.success({ dbEntries: dbLeaderboard.length, dbTotal, redisTotal, driftDetected, healed })
        return NextResponse.json({ success: true, dbEntries: dbLeaderboard.length, dbTotal, redisTotal, driftDetected, healed })

    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'Leaderboard validation failed' }, { status: 500 })
    }
}
