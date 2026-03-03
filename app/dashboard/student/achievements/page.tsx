import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'


export default async function AchievementsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'STUDENT') {
        redirect('/auth/signin')
    }

    // Fetch all achievements
    const allAchievements = await prisma.achievement.findMany({
        orderBy: { xpReward: 'asc' }
    })

    // Fetch user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: session.user.id },
        include: { achievement: true }
    })

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Group by category
    const categories = Array.from(new Set(allAchievements.map(a => a.category)))

    return (
        <div className="min-h-screen bg-surface dark:bg-background p-6 transition-colors duration-300">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/dashboard/student" className="text-mist hover:text-ink dark:hover:text-white transition">
                        ← Back to Dashboard
                    </Link>
                </div>
                <h1 className="text-3xl font-display font-bold text-ink dark:text-white mb-2">My Achievements</h1>
                <p className="text-mist dark:text-mist/80">Unlock badges and earn XP by playing games and completing challenges!</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-border dark:border-slate-700 transition-colors">
                    <div className="text-2xl font-bold text-ink dark:text-white">{userAchievements.length} / {allAchievements.length}</div>
                    <div className="text-sm text-mist dark:text-mist/80">Badges Unlocked</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-border dark:border-slate-700 transition-colors">
                    <div className="text-2xl font-bold text-amber">
                        {userAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0)} XP
                    </div>
                    <div className="text-sm text-mist dark:text-mist/80">Total XP from Badges</div>
                </div>
            </div>

            <div className="space-y-8">
                {categories.map(category => (
                    <div key={category}>
                        <h2 className="text-xl font-bold mb-4 capitalize dark:text-white">{category.toLowerCase()} Badges</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {allAchievements.filter(a => a.category === category).map(achievement => {
                                const isUnlocked = unlockedIds.has(achievement.id)
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${isUnlocked
                                            ? 'bg-white dark:bg-slate-800 border-emerald/50 dark:border-emerald/30 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-60 grayscale'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-4xl mb-2">{achievement.icon}</div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${isUnlocked
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{achievement.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{achievement.description}</p>
                                        <div className="text-xs font-semibold text-amber flex items-center gap-1">
                                            <span>⚡</span> {achievement.xpReward} XP
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
