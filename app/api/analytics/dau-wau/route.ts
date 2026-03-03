import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRegionalReadClient } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'


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

        const endDate = endOfDay(new Date())
        const startDate = startOfDay(subDays(endDate, days))

        // Get daily active users
        const dailyData = await prisma.analyticsEvent.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                userId: {
                    not: null,
                },
            },
            _count: {
                userId: true,
            },
        })

        // Group by date and count unique users
        const dateMap = new Map<string, Set<string>>()

        const events = await prisma.analyticsEvent.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                userId: {
                    not: null,
                },
            },
            select: {
                userId: true,
                createdAt: true,
            },
        })

        events.forEach((event) => {
            const dateKey = startOfDay(event.createdAt).toISOString()
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, new Set())
            }
            if (event.userId) {
                dateMap.get(dateKey)!.add(event.userId)
            }
        })

        // Convert to array format for charts
        const chartData = Array.from(dateMap.entries())
            .map(([date, userSet]) => ({
                date,
                activeUsers: userSet.size,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate weekly active users (last 7 days)
        const last7Days = subDays(endDate, 7)
        const weeklyUsers = new Set<string>()

        events.forEach((event) => {
            if (event.createdAt >= last7Days && event.userId) {
                weeklyUsers.add(event.userId)
            }
        })

        return NextResponse.json({
            chartData,
            summary: {
                dau: chartData[chartData.length - 1]?.activeUsers || 0,
                wau: weeklyUsers.size,
                avgDau: chartData.reduce((sum, d) => sum + d.activeUsers, 0) / chartData.length || 0,
            },
        })
    } catch (error: any) {
        console.error('DAU/WAU analytics error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
