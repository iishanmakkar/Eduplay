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

        // Get signup events
        const signupEvents = await prisma.analyticsEvent.findMany({
            where: {
                event: 'signup',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                userId: true,
                createdAt: true,
            },
        })

        // Get payment events
        const paymentEvents = await prisma.analyticsEvent.findMany({
            where: {
                event: 'payment_success',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                userId: true,
                createdAt: true,
            },
        })

        // Calculate conversion rate
        const totalSignups = signupEvents.length
        const totalConversions = paymentEvents.length
        const conversionRate = totalSignups > 0 ? (totalConversions / totalSignups) * 100 : 0

        // Build funnel data
        const funnelData = [
            {
                stage: 'Signups',
                count: totalSignups,
                percentage: 100,
            },
            {
                stage: 'Trial Started',
                count: totalSignups, // All signups start trial
                percentage: 100,
            },
            {
                stage: 'Active Users',
                count: Math.floor(totalSignups * 0.7), // Estimate 70% become active
                percentage: 70,
            },
            {
                stage: 'Paid Conversion',
                count: totalConversions,
                percentage: Math.round(conversionRate),
            },
        ]

        return NextResponse.json({
            funnelData,
            summary: {
                totalSignups,
                totalConversions,
                conversionRate: Math.round(conversionRate * 10) / 10,
            },
        })
    } catch (error: any) {
        console.error('Conversion funnel analytics error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch conversion funnel' },
            { status: 500 }
        )
    }
}
