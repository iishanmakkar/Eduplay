import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'
import { getTrialStatus } from '@/lib/featureGate'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin')
    }

    if (!session.user.schoolId) {
        redirect('/auth/signin')
    }

    // Fetch school data
    const school = await prisma.school.findFirst({
        where: {
            id: session.user.schoolId,
            deletedAt: null,
        },
        include: {
            subscription: true,
            users: true,
            classes: {
                include: {
                    _count: {
                        select: { students: true },
                    },
                },
            },
        },
    })

    if (!school) {
        redirect('/auth/signin')
    }

    // Get trial status
    const trialStatus = await getTrialStatus(school.id)

    // Calculate stats
    const totalTeachers = school.users.filter((u) => u.role === 'TEACHER').length
    const totalStudents = school.users.filter((u) => u.role === 'STUDENT').length
    const totalClasses = school.classes.length

    // Get recent activity
    const recentGames = await prisma.gameResult.aggregate({
        where: {
            student: { schoolId: school.id },
            completedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
        },
        _count: true,
    })

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">
            {/* Trial Banner */}
            {trialStatus.isTrial && (
                <TrialBanner daysLeft={trialStatus.daysLeft} plan={school.subscription?.plan || 'STARTER'} />
            )}

            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                            {school.name}
                        </h1>
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                            Admin Command Center • <span className="text-emerald-500">{school.subscription?.plan} Tier</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center gap-3">
                            <Link
                                href="/dashboard/admin/billing"
                                className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                            >
                                💳 Billing
                            </Link>
                            <Link
                                href="/profile"
                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                ⚙️ Profile
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
                            >
                                Sign Out
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {[
                        { icon: '👥', label: 'Total Students', value: totalStudents, color: 'emerald' },
                        { icon: '👨‍🏫', label: 'Teachers', value: totalTeachers, color: 'indigo' },
                        { icon: '📚', label: 'Active Classes', value: totalClasses, color: 'sky' },
                        { icon: '🎮', label: 'Games Played', value: recentGames._count, color: 'purple', badge: '7 days' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-5xl transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                                {stat.badge && (
                                    <div className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {stat.badge}
                                    </div>
                                )}
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:bg-${stat.color}-500/10 transition-all`} />
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 mb-12 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-10">Administrative Control</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '👨‍🏫', title: 'Invite Teachers', desc: 'Add more educators', link: '#' },
                            { icon: '💳', title: 'Upgrade Plan', desc: 'Unlock more features', link: '/dashboard/admin/billing' },
                            { icon: '🔑', title: 'API Access', desc: 'Manage external data', link: '/dashboard/admin/api-keys' }
                        ].map((action, i) => (
                            <Link
                                key={i}
                                href={action.link}
                                className="flex items-center gap-6 p-8 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group active:scale-95 shadow-sm"
                            >
                                <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{action.icon}</div>
                                <div className="text-left">
                                    <div className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{action.title}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{action.desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Classes Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">Classes Overview</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Live snapshot of school-wide classroom activity</p>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Total Resources: {totalClasses}
                        </div>
                    </div>

                    {totalClasses === 0 ? (
                        <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="text-8xl mb-8 opacity-20 animate-pulse">📚</div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No classes found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Teachers will populate this list as they create environments.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {school.classes.map((classItem) => (
                                <div
                                    key={classItem.id}
                                    className="group relative bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="text-5xl transform group-hover:scale-125 transition-transform duration-300">{classItem.emoji}</div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                                {classItem.name}
                                            </h3>
                                            <div className="inline-block px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                Grade {classItem.grade}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                                            <span className="text-emerald-500">👥</span> {classItem._count.students} Students
                                        </div>
                                        <div className="font-mono font-black text-emerald-500 text-sm tracking-widest">{classItem.classCode}</div>
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
