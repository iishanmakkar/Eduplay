/**
 * Redis Leaderboard API — Weekly Multiplayer Rankings
 * GET /api/multiplayer/leaderboard
 *
 * Returns top N players from Redis sorted set.
 * Falls back to Postgres GROUP BY query if Redis is unavailable.
 *
 * Performance: Redis ZREVRANGE = O(log N + K) vs  Postgres GROUP BY = O(N log N)
 * At 100K users this is the difference between <5ms and >500ms.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTopLeaderboard, getWeekStart } from '@/lib/cache/leaderboard'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
        const period = searchParams.get('period') || 'week' // 'day', 'week', 'all'

        // ── 1. Try Redis sorted set first ──────────────────────────────────
        if (period === 'week' || period === 'all') {
            const weekStart = period === 'week' ? getWeekStart() : undefined
            const boardType = period === 'all' ? 'alltime' : 'global'
            const redisResult = await getTopLeaderboard(boardType, undefined, limit, weekStart)

            if (redisResult && redisResult.length > 0) {
                return NextResponse.json({
                    success: true,
                    leaderboard: redisResult,
                    source: 'redis',
                })
            }
        }

        // ── 2. DB fallback (for 'day' period or cold Redis) ───────────────
        const now = new Date()
        let dateFilter: any = {}

        if (period === 'day') {
            const today = new Date(now)
            today.setHours(0, 0, 0, 0)
            dateFilter = { match: { createdAt: { gte: today } } }
        } else if (period === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateFilter = { match: { createdAt: { gte: lastWeek } } }
        }

        const topWinners = await prisma.matchParticipant.groupBy({
            by: ['name'],
            _count: { isWinner: true },
            _sum: { score: true },
            where: { isWinner: true, ...dateFilter },
            orderBy: { _count: { isWinner: 'desc' } },
            take: limit,
        })

        const names = topWinners.map((w: any) => w.name)
        const latestAvatars = await prisma.matchParticipant.findMany({
            where: { name: { in: names }, avatar: { not: null } },
            orderBy: { match: { createdAt: 'desc' } },
            distinct: ['name'],
            select: { name: true, avatar: true },
        })

        const avatarMap = new Map(latestAvatars.map((a: any) => [a.name, a.avatar]))

        const leaderboard = topWinners.map((stat: any, idx: number) => ({
            rank: idx + 1,
            studentId: stat.name,
            studentName: stat.name,
            wins: stat._count.isWinner,
            weeklyXP: stat._sum.score || 0,
            avatar: avatarMap.get(stat.name) || '👤',
        }))

        return NextResponse.json({ success: true, leaderboard, source: 'db' })
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
