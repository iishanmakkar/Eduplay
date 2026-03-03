import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ReferralSystem } from '@/lib/gamification/referral-system'
import { CopyButton } from '@/components/ui/CopyButton'

export default async function IndependentDashboard() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'INDEPENDENT') {
        redirect('/auth/signin')
    }

    const userId = session.user.id

    // Check subscription status
    const subscription = await prisma.independentSubscription.findUnique({
        where: { userId },
    })

    const isSubscriptionActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

    if (!isSubscriptionActive) {
        redirect('/pricing?locked=true&reason=subscription_required')
    }

    // Fetch user stats
    const [gameResults, streak, achievements, totalXP, referralLink, referralCount] = await Promise.all([
        prisma.gameResult.findMany({
            where: { studentId: userId },
            orderBy: { completedAt: 'desc' },
            take: 5,
        }),
        prisma.streak.findUnique({ where: { studentId: userId } }),
        prisma.userAchievement.count({ where: { userId } }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, level: true },
        }),
        ReferralSystem.getOrCreateLink(userId),
        prisma.referralReward.count({ where: { referral: { userId } } })
    ])

    const subExpiresAt = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
        : 'N/A'

    return (
        <div className={theme.page}>
            {/* Header */}
            <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className={`text-2xl font-display font-bold ${theme.textPrimary}`}>
                            My Learning Hub
                        </h1>
                        <p className={theme.textSecondary}>
                            Welcome back, {session.user.firstName || session.user.name?.split(' ')[0] || 'Learner'}! 🚀
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard/settings" className={theme.buttonSecondary + ' px-4 py-2 text-sm'}>
                            ⚙️ Settings
                        </Link>
                        <Link href="/api/auth/signout" className={theme.buttonSecondary + ' px-4 py-2 text-sm'}>
                            Sign Out
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Subscription Banner */}
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-sm font-bold text-purple-800 dark:text-purple-300">
                            ✅ Individual Plan Active
                        </span>
                        <span className="text-sm text-purple-600 dark:text-purple-400 ml-2">
                            Renews {subExpiresAt}
                        </span>
                    </div>
                    <Link href="/dashboard/settings" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        Manage Subscription
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total XP', value: (totalXP?.xp || 0).toLocaleString(), icon: '⚡' },
                        { label: 'Level', value: `Level ${totalXP?.level || 1}`, icon: '🏆' },
                        { label: 'Current Streak', value: `${streak?.currentStreak || 0} days`, icon: '🔥' },
                        { label: 'Achievements', value: achievements.toString(), icon: '🎖️' },
                    ].map(stat => (
                        <div key={stat.label} className={theme.card + ' p-5 text-center'}>
                            <div className="text-3xl mb-2">{stat.icon}</div>
                            <div className={`text-2xl font-bold ${theme.textPrimary}`}>{stat.value}</div>
                            <div className={`text-sm ${theme.textSecondary}`}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Referral Program */}
                <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-2xl">
                        <div className="w-64 h-64 bg-white rounded-full"></div>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-bold font-display mb-2">🎁 Give a Month, Get a Month</h2>
                            <p className="text-emerald-50 mb-4">
                                Invite friends to EduPlay. When they sign up using your link, they get access, and you get <strong className="text-white bg-emerald-700/50 px-2 py-0.5 rounded">1 month of free access</strong> added to your subscription!
                            </p>
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                                <code className="font-mono text-lg font-bold select-all overflow-x-auto whitespace-nowrap">
                                    {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup?ref={referralLink?.code}
                                </code>
                                <CopyButton text={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup?ref=${referralLink?.code}`} />
                            </div>
                        </div>
                        <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 min-w-[200px]">
                            <div className="text-4xl font-bold mb-1">{referralCount}</div>
                            <div className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Friends Joined</div>
                        </div>
                    </div>
                </div>

                {/* AI Knowledge Graph Upsell (Phase 6) */}
                <div className="mb-8 p-6 bg-slate-900 rounded-2xl shadow-xl text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/30 blur-[100px] rounded-full"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded uppercase tracking-wide">Beta Feature</span>
                                <h2 className="text-2xl font-bold font-display">Deep AI Mastery Insights</h2>
                            </div>
                            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                                See exactly what your child knows. Our new <strong>Bayesian Knowledge Tracing</strong> engine analyzes every single answer to build a real-time map of their neural pathways. Stop guessing if they understand fractions—know with mathematical certainty.
                            </p>
                            <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30">
                                🔓 Unlock Full Analytics
                            </Link>
                        </div>

                        {/* Faux graph / visual */}
                        <div className="hidden md:flex flex-col gap-3 opacity-60 pointer-events-none select-none">
                            {[
                                { name: 'Single Digit Addition (MATH.ADD.1D)', prob: 98 },
                                { name: 'Basic Fractions (MATH.FRAC.BAS)', prob: 45 },
                                { name: 'Word Problems (MATH.WORD.L1)', prob: 12 },
                            ].map(skill => (
                                <div key={skill.name} className="bg-slate-800/80 backdrop-blur border border-slate-700 p-3 rounded-lg w-64">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 truncate w-3/4">{skill.name}</span>
                                        <span className={skill.prob > 90 ? 'text-emerald-400' : skill.prob > 40 ? 'text-amber-400' : 'text-rose-400'}>{skill.prob}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${skill.prob > 90 ? 'bg-emerald-500' : skill.prob > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: `${skill.prob}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Games Grid */}
                <div className={theme.card + ' p-6 mb-8'}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-display font-bold ${theme.textPrimary}`}>Play Games</h2>
                        <Link href="/games" className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { name: 'Speed Math', emoji: '⚡', href: '/games/speed-math' },
                            { name: 'Science Quiz', emoji: '🔬', href: '/games/science-quiz' },
                            { name: 'Word Scramble', emoji: '📝', href: '/games/word-scramble' },
                            { name: 'Memory Match', emoji: '🧠', href: '/games/memory-match' },
                        ].map(game => (
                            <Link
                                key={game.name}
                                href={game.href}
                                className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                            >
                                <span className="text-3xl">{game.emoji}</span>
                                <span className={`text-xs font-semibold ${theme.textPrimary} text-center`}>{game.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={theme.card + ' p-6'}>
                    <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-4`}>Recent Activity</h2>
                    {gameResults.length === 0 ? (
                        <div className={`text-center py-8 ${theme.textSecondary}`}>
                            <div className="text-4xl mb-3">🎮</div>
                            <p>No games played yet. Start playing to earn XP!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {gameResults.map((result: any) => (
                                <div key={result.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <div>
                                        <div className={`font-semibold ${theme.textPrimary} text-sm`}>{result.gameType.replace(/_/g, ' ')}</div>
                                        <div className={`text-xs ${theme.textSecondary}`}>
                                            {new Date(result.completedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{result.xpEarned} XP</div>
                                        <div className={`text-xs ${theme.textSecondary}`}>{result.score} pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
