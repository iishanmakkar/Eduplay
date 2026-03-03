import { prisma } from '@/lib/prisma'

export type EventType =
    | 'page_view'
    | 'signup'
    | 'login'
    | 'logout'
    | 'game_started'
    | 'game_completed'
    | 'class_created'
    | 'class_joined'
    | 'assignment_created'
    | 'assignment_completed'
    | 'checkout_initiated'
    | 'payment_success'
    | 'payment_failed'
    | 'subscription_upgraded'
    | 'subscription_cancelled'
    | 'profile_updated'

interface TrackEventOptions {
    event: EventType
    userId?: string
    schoolId?: string
    details?: Record<string, any>
}

/**
 * Track an analytics event
 */
export async function trackEvent({
    event,
    userId,
    schoolId,
    details,
}: TrackEventOptions) {
    try {
        await prisma.analyticsEvent.create({
            data: {
                event,
                userId,
                details: {
                    ...(details || {}),
                    ...(schoolId ? { schoolId } : {})
                },
            },
        })
    } catch (error) {
        // Don't throw - analytics failures shouldn't break the app
        console.error('Analytics tracking error:', error)
    }
}

/**
 * Track page view
 */
export async function trackPageView(
    path: string,
    userId?: string,
    schoolId?: string
) {
    return trackEvent({
        event: 'page_view',
        userId,
        schoolId,
        details: { path },
    })
}

/**
 * Track game play
 */
export async function trackGamePlay(
    gameType: string,
    userId: string,
    score: number,
    xpEarned: number
) {
    return trackEvent({
        event: 'game_completed',
        userId,
        details: {
            gameType,
            score,
            xpEarned,
        },
    })
}

/**
 * Track signup
 */
export async function trackSignup(
    userId: string,
    schoolId: string,
    role: string
) {
    return trackEvent({
        event: 'signup',
        userId,
        schoolId,
        details: { role },
    })
}

/**
 * Track payment
 */
export async function trackPayment(
    userId: string,
    schoolId: string,
    amount: number,
    plan: string,
    success: boolean
) {
    return trackEvent({
        event: success ? 'payment_success' : 'payment_failed',
        userId,
        schoolId,
        details: {
            amount,
            plan,
        },
    })
}

/**
 * Get event counts by type for a date range
 */
export async function getEventCounts(
    startDate: Date,
    endDate: Date,
    eventTypes?: EventType[]
) {
    const where: any = {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
    }

    if (eventTypes && eventTypes.length > 0) {
        where.event = { in: eventTypes }
    }

    const events = await prisma.analyticsEvent.groupBy({
        by: ['event'],
        where,
        _count: true,
    })

    return events.reduce((acc, event) => {
        acc[event.event] = event._count
        return acc
    }, {} as Record<string, number>)
}

/**
 * Get daily active users
 */
export async function getDailyActiveUsers(startDate: Date, endDate: Date) {
    const events = await prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            userId: {
                not: null,
            },
        },
        _count: true,
    })

    return events.length
}
