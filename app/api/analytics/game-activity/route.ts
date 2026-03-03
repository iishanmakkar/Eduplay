import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRegionalReadClient } from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'


export async function GET(req: NextRequest) {
    try {
        const region = req.headers.get('x-region') || 'US'
        const prisma = getRegionalReadClient(region)
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get('days') || '30')

        const endDate = new Date()
        const startDate = startOfDay(subDays(endDate, days))

        // Get all game results in date range
        const gameResults = await prisma.gameResult.findMany({
            where: {
                completedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                gameType: true,
                completedAt: true,
                score: true,
                xpEarned: true,
            },
            orderBy: {
                completedAt: 'asc',
            },
        })

        // Group by game type
        const gameTypeMap = new Map<string, number>()

        gameResults.forEach((result) => {
            const count = gameTypeMap.get(result.gameType) || 0
            gameTypeMap.set(result.gameType, count + 1)
        })

        // Convert to chart data
        const chartData = Array.from(gameTypeMap.entries())
            .map(([gameType, count]) => ({
                gameType: gameType.replace(/_/g, ' '),
                plays: count,
            }))
            .sort((a, b) => b.plays - a.plays)

        // Calculate summary stats
        const totalPlays = gameResults.length
        const avgScore = gameResults.reduce((sum, r) => sum + r.score, 0) / totalPlays || 0
        const totalXP = gameResults.reduce((sum, r) => sum + r.xpEarned, 0)

        return NextResponse.json({
            chartData,
            summary: {
                totalPlays,
                avgScore: Math.round(avgScore),
                totalXP,
                uniqueGameTypes: gameTypeMap.size,
            },
        })
    } catch (error: any) {
        console.error('Game activity analytics error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch game activity' },
            { status: 500 }
        )
    }
}
