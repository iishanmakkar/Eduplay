
import { prisma } from '@/lib/prisma'
import { fetchWithCache } from './utils'

const CACHE_TTL = {
    DASHBOARD_STATS: 300, // 5 minutes
    LEADERBOARD: 60,      // 1 minute
}

export type DashboardStats = {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    totalGamesPlayed: number
    activeSubscriptions: number
    totalRevenue: number
}

export async function getCachedDashboardStats(): Promise<DashboardStats> {
    return fetchWithCache(
        'admin:dashboard:stats',
        async () => {
            const [
                totalStudents,
                totalTeachers,
                totalClasses,
                totalGamesPlayed,
                activeSubscriptions
            ] = await Promise.all([
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({ where: { role: 'TEACHER' } }),
                prisma.class.count(),
                prisma.gameResult.count(),
                prisma.subscription.count({
                    where: { status: { in: ['ACTIVE', 'TRIALING'] } }
                })
            ])

            // Calculate revenue (approximate based on active subscriptions)
            // In a real app, we'd query the Transaction table or Stripe/Razorpay
            const subscriptions = await prisma.subscription.findMany({
                where: { status: 'ACTIVE' },
                select: { plan: true }
            })

            const revenue = subscriptions.reduce((acc, sub) => {
                if (sub.plan === 'SCHOOL') return acc + 4999
                if (sub.plan === 'DISTRICT') return acc + 19999
                return acc
            }, 0)

            return {
                totalStudents,
                totalTeachers,
                totalClasses,
                totalGamesPlayed,
                activeSubscriptions,
                totalRevenue: revenue
            }
        },
        { ttl: CACHE_TTL.DASHBOARD_STATS }
    )
}

export async function getCachedLeaderboard(limit: number = 10) {
    return fetchWithCache(
        `leaderboard:top:${limit}`,
        async () => {
            // Logic to fetch top students by XP
            // This is a placeholder, actual implementation depends on Leaderboard model usage
            return prisma.leaderboard.findMany({
                orderBy: { totalXP: 'desc' },
                take: limit,
            })
        },
        { ttl: CACHE_TTL.LEADERBOARD }
    )
}
