import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { theme } from '@/lib/theme'

export default async function OwnerMRRPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'OWNER') {
        redirect('/auth/signin')
    }

    // Fetch MRR data
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
        activeSchoolSubs,
        activeIndependentSubs,
        recentTransactions,
        lastMonthTransactions,
        totalRevenue,
        churnedThisMonth,
        newSchoolsThisMonth,
    ] = await Promise.all([
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.independentSubscription.count({ where: { status: 'ACTIVE' } }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'success', createdAt: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'success', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            _sum: { amount: true },
        }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'success' },
            _sum: { amount: true },
        }),
        prisma.subscription.count({
            where: { status: 'CANCELED', cancelledAt: { gte: thirtyDaysAgo } }
        }),
        prisma.school.count({
            where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null }
        }),
    ])

    const currentMRR = (recentTransactions._sum.amount || 0) / 100
    const lastMRR = (lastMonthTransactions._sum.amount || 0) / 100
    const mrrGrowth = lastMRR > 0 ? ((currentMRR - lastMRR) / lastMRR * 100).toFixed(1) : '0'
    const totalRevenueAmount = (totalRevenue._sum.amount || 0) / 100
    const totalActiveSubs = activeSchoolSubs + activeIndependentSubs

    // Estimated ARR
    const estimatedARR = currentMRR * 12

    const stats = [
        { label: 'MRR (This Month)', value: `${currentMRR.toLocaleString()}`, icon: '💰', badge: `${mrrGrowth}% vs last month`, badgeColor: Number(mrrGrowth) >= 0 ? 'emerald' : 'red' },
        { label: 'ARR (Projected)', value: `${estimatedARR.toLocaleString()}`, icon: '📈', badge: 'Annualized', badgeColor: 'blue' },
        { label: 'Active Subscriptions', value: totalActiveSubs.toString(), icon: '✅', badge: `${activeSchoolSubs} schools · ${activeIndependentSubs} indie`, badgeColor: 'purple' },
        { label: 'Total Revenue', value: `${totalRevenueAmount.toLocaleString()}`, icon: '🏦', badge: 'All time', badgeColor: 'amber' },
        { label: 'Churned (30d)', value: churnedThisMonth.toString(), icon: '📉', badge: 'Cancellations', badgeColor: 'red' },
        { label: 'New Schools (30d)', value: newSchoolsThisMonth.toString(), icon: '🏫', badge: 'Onboarded', badgeColor: 'emerald' },
    ]

    const badgeColors: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }

    return (
        <div className={theme.page}>
            {/* Header */}
            <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/owner" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                            ← Dashboard
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-display font-bold ${theme.textPrimary}`}>
                                MRR & Revenue Analytics
                            </h1>
                            <p className={theme.textSecondary}>EduPlay SaaS Metrics • Owner Only</p>
                        </div>
                    </div>
                    <Link href="/dashboard/owner/schools" className={theme.buttonSecondary + ' px-4 py-2 text-sm'}>
                        Manage Schools →
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className={theme.card + ' p-6'}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl">{stat.icon}</div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColors[stat.badgeColor]}`}>
                                    {stat.badge}
                                </span>
                            </div>
                            <div className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>{stat.value}</div>
                            <div className={theme.textSecondary + ' text-sm'}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className={theme.card + ' p-6'}>
                        <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-6`}>Revenue Breakdown</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <div>
                                    <div className={`font-bold ${theme.textPrimary}`}>School Subscriptions</div>
                                    <div className={`text-sm ${theme.textSecondary}`}>{activeSchoolSubs} active schools</div>
                                </div>
                                <div className={`text-xl font-bold text-emerald-600 dark:text-emerald-400`}>
                                    {activeSchoolSubs} plans
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <div>
                                    <div className={`font-bold ${theme.textPrimary}`}>Independent Learners</div>
                                    <div className={`text-sm ${theme.textSecondary}`}>{activeIndependentSubs} × $5/month</div>
                                </div>
                                <div className={`text-xl font-bold text-purple-600 dark:text-purple-400`}>
                                    ${(activeIndependentSubs * 500).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={theme.card + ' p-6'}>
                        <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-6`}>Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/owner/schools"
                                className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition group"
                            >
                                <div>
                                    <div className="font-bold text-emerald-800 dark:text-emerald-300">Provision New School</div>
                                    <div className="text-sm text-emerald-600 dark:text-emerald-500">Create school + admin account</div>
                                </div>
                                <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link
                                href="/dashboard/owner"
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition group"
                            >
                                <div>
                                    <div className={`font-bold ${theme.textPrimary}`}>Platform Overview</div>
                                    <div className={`text-sm ${theme.textSecondary}`}>All schools, users, games</div>
                                </div>
                                <span className={`${theme.textSecondary} group-hover:translate-x-1 transition-transform`}>→</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className={theme.card + ' p-6'}>
                    <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-4`}>
                        This Month — {recentTransactions._count} Transactions
                    </h2>
                    <p className={`${theme.textSecondary} text-sm`}>
                        Total collected: <span className="font-bold text-emerald-600 dark:text-emerald-400">${currentMRR.toLocaleString()}</span> in the last 30 days.
                    </p>
                </div>
            </main>
        </div>
    )
}
