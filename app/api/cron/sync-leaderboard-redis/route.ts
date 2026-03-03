import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/cache/redis'
import { createCronLogger } from '@/lib/logger'

/**
 * Leaderboard Redis Sync — runs every 5min during school hours (08:00-22:00).
 * Writes Postgres leaderboard rows into Redis sorted sets.
 * Read path: ZREVRANGE (O log N) instead of Postgres ORDER BY full scan.
 * Schedule: "* /5 8-22 * * *" (without the space)
 */

const CRON_SECRET = process.env.CRON_SECRET

function getMondayUTC(date: Date = new Date()): string {
    const d = new Date(date)
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    d.setUTCDate(diff)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('sync-leaderboard-redis')
    log.start()

    const weekStart = getMondayUTC()
    const redisKey = `leaderboard:week:${weekStart}`

    try {
        const entries = await (prisma as any).leaderboard.findMany({
            where: { weekStart: new Date(`${weekStart}T00:00:00Z`) },
            select: { userId: true, weeklyXP: true, schoolId: true },
            orderBy: { weeklyXP: 'desc' },
            take: 10000,
        }) as Array<{ userId: string; weeklyXP: number; schoolId: string | null }>

        if (entries.length === 0) {
            log.success({ synced: 0, weekStart })
            return NextResponse.json({ ok: true, synced: 0 })
        }

        const r = redis as any

        if (typeof r.pipeline === 'function') {
            const pipeline = r.pipeline()
            pipeline.del(redisKey)
            for (const entry of entries) {
                pipeline.zadd(redisKey, { score: entry.weeklyXP, member: entry.userId })
            }
            pipeline.expire(redisKey, 60 * 60 * 24 * 7)

            // School-scoped leaderboards
            const bySchool = new Map<string, typeof entries>()
            for (const entry of entries) {
                if (entry.schoolId) {
                    if (!bySchool.has(entry.schoolId)) bySchool.set(entry.schoolId, [])
                    bySchool.get(entry.schoolId)!.push(entry)
                }
            }
            for (const [schoolId, schoolEntries] of bySchool) {
                const schoolKey = `leaderboard:school:${schoolId}:${weekStart}`
                pipeline.del(schoolKey)
                for (const entry of schoolEntries) {
                    pipeline.zadd(schoolKey, { score: entry.weeklyXP, member: entry.userId })
                }
                pipeline.expire(schoolKey, 60 * 60 * 24 * 7)
            }

            await pipeline.exec()
        } else {
            await r.del(redisKey)
            for (const entry of entries) {
                await r.zadd(redisKey, { score: entry.weeklyXP, member: entry.userId })
            }
            await r.expire(redisKey, 60 * 60 * 24 * 7)
        }

        log.success({ synced: entries.length, weekStart, redisKey })
        return NextResponse.json({ ok: true, synced: entries.length, weekStart })

    } catch (error) {
        log.error(error)
        return NextResponse.json({ error: 'Leaderboard sync failed' }, { status: 500 })
    }
}

/**
 * Read top N from Redis sorted set leaderboard.
 * Returns null on Redis miss — caller should fall back to Postgres.
 */
async function getLeaderboardFromRedis(weekStart: string, limit = 10) {
    const redisKey = `leaderboard:week:${weekStart}`
    try {
        const r = redis as any
        return await r.zrevrange(redisKey, 0, limit - 1, { withScores: true })
    } catch {
        return null
    }
}
