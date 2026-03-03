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

        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get('days') || '30')

        const endDate = endOfDay(new Date())
        const startDate = startOfDay(subDays(endDate, days))

        // Get all transactions in date range
        const transactions = await prisma.paymentTransaction.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'success',
            },
            select: {
                amount: true,
                currencyCode: true,
                createdAt: true,
                subscription: {
                    select: {
                        plan: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        })

        // Group by date
        const dateMap = new Map<string, number>()
        let totalRevenue = 0

        transactions.forEach((transaction: any) => {
            const dateKey = startOfDay(transaction.createdAt).toISOString()
            const amount = transaction.amount / 100 // Convert paise to rupees

            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + amount)
            totalRevenue += amount
        })

        // Convert to chart data
        const chartData = Array.from(dateMap.entries())
            .map(([date, revenue]) => ({
                date,
                revenue: Math.round(revenue),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate MRR from school subscriptions
        const activeSubscriptions = await prisma.subscription.findMany({
            where: { status: 'ACTIVE' },
            include: {
                transactions: {
                    where: { status: 'success' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        let mrr = 0
        activeSubscriptions.forEach((sub: any) => {
            if (sub.transactions.length > 0) {
                mrr += sub.transactions[0].amount / 100
            }
        })

        // Add MRR from independent subscriptions ($5/month each)
        const INDEPENDENT_MONTHLY_PRICE = 500
        const activeIndependentSubs = await prisma.independentSubscription.count({
            where: { status: 'ACTIVE' },
        })
        mrr += activeIndependentSubs * INDEPENDENT_MONTHLY_PRICE

        // Calculate ARR (Annual Recurring Revenue)
        const arr = mrr * 12

        return NextResponse.json({
            chartData,
            summary: {
                totalRevenue: Math.round(totalRevenue),
                mrr: Math.round(mrr),
                arr: Math.round(arr),
                avgTransactionValue: transactions.length > 0
                    ? Math.round(totalRevenue / transactions.length)
                    : 0,
                transactionCount: transactions.length,
            },
        })
    } catch (error: any) {
        console.error('Revenue analytics error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch revenue analytics' },
            { status: 500 }
        )
    }
}
