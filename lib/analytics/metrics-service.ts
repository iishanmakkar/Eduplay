import { prisma } from '@/lib/prisma'
import { SubscriptionPlan } from '@prisma/client'

const PRICING: Record<SubscriptionPlan, number> = {
    STARTER: 0,
    SCHOOL: 4999,
    DISTRICT: 9999
}

export interface DashboardMetrics {
    mrr: number
    arr: number
    arpu: number
    churnRate: number
    activeSubscriptions: number
    totalUsers: number
    totalSchools: number
    growthRate: number
}

export class MetricsService {
    static async getDashboardMetrics(): Promise<DashboardMetrics> {
        const [
            subscriptions,
            usersCount,
            schoolsCount,
            usersLastMonth
        ] = await Promise.all([
            prisma.subscription.findMany({
                select: {
                    plan: true,
                    status: true,
                    createdAt: true,
                    cancelledAt: true
                }
            }),
            prisma.user.count(),
            prisma.school.count(),
            prisma.user.count({
                where: {
                    createdAt: {
                        lt: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            })
        ])

        const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE' || s.status === 'TRIALING')
        const canceledSubs = subscriptions.filter(s => s.status === 'CANCELED')

        // Calculate MRR
        const mrr = activeSubs.reduce((sum, sub) => {
            return sum + (PRICING[sub.plan] || 0)
        }, 0)

        // Calculate ARR
        const arr = mrr * 12

        // Calculate ARPU (Average Revenue Per User - considering Schools as the paying entity)
        // If MRR is 0, avoid division by zero
        const payingCustomers = activeSubs.filter(s => PRICING[s.plan] > 0).length
        const arpu = payingCustomers > 0 ? Math.round(mrr / payingCustomers) : 0

        // Calculate Churn Rate
        // Logic: Cancelled / (Active + Cancelled) * 100 for simple snapshot churn
        const totalSubs = activeSubs.length + canceledSubs.length
        const churnRate = totalSubs > 0
            ? (canceledSubs.length / totalSubs) * 100
            : 0

        // Calculate Growth (Month over Month users)
        const growthRate = usersLastMonth > 0
            ? ((usersCount - usersLastMonth) / usersLastMonth) * 100
            : 100

        return {
            mrr,
            arr,
            arpu,
            churnRate: parseFloat(churnRate.toFixed(1)),
            activeSubscriptions: activeSubs.length,
            totalUsers: usersCount,
            totalSchools: schoolsCount,
            growthRate: parseFloat(growthRate.toFixed(1))
        }
    }

    /**
     * Reconstruct historical MRR for the last 6 months
     */
    static async getMRRHistory() {
        const subscriptions = await prisma.subscription.findMany({
            select: {
                plan: true,
                status: true, // we need status to know if it WAS active, but history is reconstructive
                createdAt: true,
                cancelledAt: true
            }
        })

        const history = []
        const today = new Date()

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
            // End of that month
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)

            const monthName = date.toLocaleString('default', { month: 'short' })

            // Filter subs that were active during this month
            // Created BEFORE end of month AND (Not cancelled OR Cancelled AFTER start of month)
            // Actually simpler: Active at end of month
            // Created <= endOfMonth AND (cancelledAt is null OR cancelledAt > endOfMonth)

            const activeAtTime = subscriptions.filter(sub => {
                const created = new Date(sub.createdAt)
                const cancelled = sub.cancelledAt ? new Date(sub.cancelledAt) : null

                return created <= endOfMonth && (!cancelled || cancelled > endOfMonth)
            })

            const mrr = activeAtTime.reduce((sum, sub) => {
                return sum + (PRICING[sub.plan] || 0)
            }, 0)

            history.push({
                month: monthName,
                // Return in 'k' format for the chart (e.g. 1500 -> 1.5)
                value: parseFloat((mrr / 1000).toFixed(1))
            })
        }

        return history
    }
}
