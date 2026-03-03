import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import SystemSettingsCard from '@/components/dashboard/SystemSettingsCard'

export default async function OwnerDashboard() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'OWNER') {
        redirect('/auth/signin')
    }

    // Fetch Global Stats
    const [
        totalSchools,
        totalUsers,
        totalActiveSubs,
        totalGames,
        recentSchools,
        revenueData
    ] = await Promise.all([
        prisma.school.count({ where: { deletedAt: null } }),
        prisma.user.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.gameResult.count(),
        prisma.school.findMany({
            where: { deletedAt: null },
            include: {
                _count: {
                    select: { users: true }
                },
                subscription: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.paymentTransaction.aggregate({
            where: { status: 'success' },
            _sum: { amount: true }
        })
    ])

    const totalRevenue = (revenueData._sum.amount || 0) / 100 // Assuming amount is in cents/paise

    return (
        <div className={theme.page}>
            {/* Header */}
            <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className={`text-2xl font-display font-bold ${theme.textPrimary}`}>
                            Platform Control Center
                        </h1>
                        <p className={theme.textSecondary}>
                            EduPlay Global Admin • {session.user.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/dashboard/owner/mrr"
                            className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition"
                        >
                            💰 MRR
                        </Link>
                        <Link
                            href="/dashboard/owner/schools"
                            className={theme.buttonSecondary + " px-4 py-2 text-sm"}
                        >
                            🏫 Schools
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className={theme.buttonSecondary + " px-4 py-2 text-sm"}
                        >
                            ⚙️ Settings
                        </Link>
                        <Link
                            href="/api/auth/signout"
                            className={theme.buttonSecondary + " px-4 py-2 text-sm"}
                        >
                            Sign Out
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* System Settings Card */}
                <SystemSettingsCard />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className={theme.card + " p-6"}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">🏫</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
                                Growth
                            </div>
                        </div>
                        <div className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>{totalSchools}</div>
                        <div className={theme.textSecondary + " text-sm"}>Total Schools</div>
                    </div>

                    <div className={theme.card + " p-6"}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">👥</div>
                        </div>
                        <div className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>{totalUsers}</div>
                        <div className={theme.textSecondary + " text-sm"}>Total Active Users</div>
                    </div>

                    <div className={theme.card + " p-6"}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">💳</div>
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full">
                                MRR active
                            </div>
                        </div>
                        <div className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>{totalActiveSubs}</div>
                        <div className={theme.textSecondary + " text-sm"}>Active Subscriptions</div>
                    </div>

                    <div className={theme.card + " p-6"}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl">💰</div>
                        </div>
                        <div className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>
                            ${totalRevenue.toLocaleString()}
                        </div>
                        <div className={theme.textSecondary + " text-sm"}>Total Revenue Generated</div>
                    </div>
                </div>

                {/* Second Row: School List & Global Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Schools List */}
                    <div className={`${theme.card} lg:col-span-2 p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-xl font-display font-bold ${theme.textPrimary}`}>Recent School Onboarding</h2>
                            <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View All Schools</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className={`pb-4 font-bold ${theme.textSecondary} text-xs uppercase tracking-wider`}>School Name</th>
                                        <th className={`pb-4 font-bold ${theme.textSecondary} text-xs uppercase tracking-wider`}>Plan</th>
                                        <th className={`pb-4 font-bold ${theme.textSecondary} text-xs uppercase tracking-wider`}>Users</th>
                                        <th className={`pb-4 font-bold ${theme.textSecondary} text-xs uppercase tracking-wider`}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentSchools.map((school) => (
                                        <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="py-4">
                                                <div className={`font-bold ${theme.textPrimary}`}>{school.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{school.slug}</div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${school.subscription?.plan === 'DISTRICT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                                                    school.subscription?.plan === 'SCHOOL' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {school.subscription?.plan || 'NONE'}
                                                </span>
                                            </td>
                                            <td className={`py-4 ${theme.textPrimary} font-medium`}>{school._count.users}</td>
                                            <td className={`py-4 ${theme.textSecondary} text-sm`}>
                                                {new Date(school.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Platform Stats */}
                    <div className="space-y-6">
                        <div className={`${theme.card} p-6`}>
                            <h3 className={`text-lg font-display font-bold mb-4 ${theme.textPrimary}`}>Infrastructure</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={theme.textSecondary}>Total Games Saved</span>
                                    <span className={`font-bold ${theme.textPrimary}`}>{totalGames.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic text-right">65% of monthly allocation used</p>
                            </div>
                        </div>

                        <div className={`${theme.card} p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white`}>
                            <h3 className="text-lg font-display font-bold mb-1">Scale Ready</h3>
                            <p className="text-emerald-50 opacity-90 text-sm mb-4">
                                The platform is currently configured for 1,000 schools across 4 regions.
                            </p>
                            <button className="w-full py-2 bg-white text-emerald-600 font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/20">
                                Expand Infrastructure
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

