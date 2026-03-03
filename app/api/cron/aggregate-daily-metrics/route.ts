import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { createCronLogger } from '@/lib/logger'

/**
 * Cron job to aggregate daily metrics
 * Should run daily at midnight
 * Calculates DAU, new signups, games played, revenue, etc.
 */
export async function GET(req: NextRequest) {
    const log = createCronLogger('aggregate-daily-metrics')
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        log.start()

        const yesterday = subDays(new Date(), 1)
        const startDate = startOfDay(yesterday)
        const endDate = endOfDay(yesterday)

        // Calculate DAU (Daily Active Users)
        const activeUserEvents = await prisma.analyticsEvent.findMany({
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
            },
            distinct: ['userId'],
        })
        const activeUsers = activeUserEvents.length

        // Calculate new signups
        const newSignups = await prisma.analyticsEvent.count({
            where: {
                event: 'signup',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Calculate games played
        const gamesPlayed = await prisma.analyticsEvent.count({
            where: {
                event: 'game_completed',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Calculate revenue
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'success',
            },
        })
        const revenue = transactions.reduce((sum: number, t: any) => sum + t.amount / 100, 0)

        // Calculate trial conversions
        const trialConversions = await prisma.analyticsEvent.count({
            where: {
                event: 'payment_success',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Calculate churned users (cancelled subscriptions)
        const churnedUsers = await prisma.subscription.count({
            where: {
                cancelledAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Get total users
        const totalUsers = await prisma.user.count()

        // Calculate average session time (placeholder - would need session tracking)
        const avgSessionTime = 0

        // Create or update daily metrics
        await prisma.usageMetric.create({
            data: {
                schoolId: 'system', // System-wide metrics
                date: startDate,
                metric: 'DAILY_SUMMARY',
                value: 0,
                metadata: {
                    totalUsers,
                    activeUsers,
                    newSignups,
                    gamesPlayed,
                    revenue,
                    trialConversions,
                    churnedUsers,
                    avgSessionTime
                } as any
            }
        })

        log.success({ activeUsers, newSignups, gamesPlayed, revenue, trialConversions, churnedUsers })
        return NextResponse.json({
            success: true,
            metrics: { date: startDate, totalUsers, activeUsers, newSignups, gamesPlayed, revenue, trialConversions, churnedUsers },
        })
    } catch (error: any) {
        log.error(error)
        return NextResponse.json(
            { error: error.message || 'Metrics aggregation failed' },
            { status: 500 }
        )
    }
}
