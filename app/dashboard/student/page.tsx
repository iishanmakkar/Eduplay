import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DailyChallengeCard from '@/components/DailyChallengeCard'
import AchievementList from '@/components/AchievementList'
import { calculateLevel, getXPForNextLevel } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Helpers ───────────────────────────────────────────────────────────────────

function masteryColor(p: number) {
    if (p >= 0.75) return 'bg-emerald-500'
    if (p >= 0.5) return 'bg-amber-400'
    if (p >= 0.25) return 'bg-orange-500'
    return 'bg-rose-500'
}

function masteryTextColor(p: number) {
    if (p >= 0.75) return 'text-emerald-600 dark:text-emerald-400'
    if (p >= 0.5) return 'text-amber-600 dark:text-amber-400'
    if (p >= 0.25) return 'text-orange-600 dark:text-orange-400'
    return 'text-rose-600 dark:text-rose-400'
}

function masteryLabel(p: number) {
    if (p >= 0.75) return 'Proficient'
    if (p >= 0.5) return 'Developing'
    if (p >= 0.25) return 'Emerging'
    return 'Novice'
}

const GAME_ICONS: Record<string, string> = {
    SPEED_MATH: '🔢', SCIENCE_QUIZ: '🔬', WORLD_FLAGS: '🌍',
    MEMORY_MATCH: '🧠', WORD_BLITZ: '📝', FRACTION_NINJA: '🥷',
    NUMBER_NINJA: '⚡', STORY_BUILDER: '📖',
}

function shortDate(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d
    const diff = Date.now() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'STUDENT') {
        redirect('/auth/signin')
    }

    // Fetch student data with BKT skill masteries
    const student = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            classesEnrolled: {
                include: {
                    class: {
                        include: { teacher: true },
                    },
                },
            },
            gameResults: {
                orderBy: { completedAt: 'desc' },
                take: 8,
                select: {
                    id: true, gameType: true, score: true,
                    xpEarned: true, accuracy: true, completedAt: true,
                }
            },
            streakData: true,
            badges: {
                orderBy: { earnedAt: 'desc' },
                take: 6,
            },
            // BKT: all skill masteries, ordered by highest P(L)
            skillMasteries: {
                orderBy: { masteryProbability: 'desc' },
                take: 12,
                include: {
                    skill: {
                        select: { name: true, code: true, subject: true }
                    }
                }
            }
        },
    })

    const xp = student?.xp || 0
    const level = calculateLevel(xp)
    const nextLevelXP = getXPForNextLevel(level)
    const currentLevelXP = getXPForNextLevel(level - 1)
    const progressXP = xp - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    const progressPercentage = Math.min(100, Math.max(0, (progressXP / xpNeededForLevel) * 100))

    const skillMasteries = student?.skillMasteries || []
    const avgMastery = skillMasteries.length > 0
        ? skillMasteries.reduce((a, m) => a + m.masteryProbability, 0) / skillMasteries.length
        : 0

    // Get today's challenge
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyChallenge = await prisma.dailyChallenge.findUnique({ where: { date: today } })
    const challengeCompleted = dailyChallenge
        ? await prisma.challengeCompletion.findUnique({
            where: { userId_challengeId: { userId: session.user.id, challengeId: dailyChallenge.id } },
        })
        : null

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">

            {/* ── Header ── */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                            Hey {session.user.firstName}! 🎮
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Student Dashboard</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                            ⚙️ Settings
                        </Link>
                        <Link href="/api/auth/signout" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                            Sign Out
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* ── Hero XP Card ── */}
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-sky-600 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner">⭐</div>
                                <div>
                                    <div className="text-3xl font-black">Level {level}</div>
                                    <div className="text-emerald-100/70 text-sm font-bold uppercase tracking-widest">{xp.toLocaleString()} XP Total</div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className="text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-1">Next Level</div>
                                <div className="text-2xl font-black">{(nextLevelXP - xp).toLocaleString()} <span className="text-sm opacity-60">XP needed</span></div>
                            </div>
                        </div>
                        {/* XP Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-emerald-100/70">
                                <span>Progress to Level {level + 1}</span>
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    style={{ width: `${progressPercentage}%` }}
                                    className="h-full bg-white/80 rounded-full transition-all duration-1000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Left Column (2/3) ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Daily Challenge */}
                        <DailyChallengeCard />

                        {/* AI Games Hub Card */}
                        <div className="bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900 rounded-3xl p-8 border border-violet-500/20 shadow-xl group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-violet-600/30 rounded-2xl flex items-center justify-center text-2xl border border-violet-500/30">🤖</div>
                                        <div>
                                            <h2 className="text-xl font-display font-black text-white">AI-Powered Learning</h2>
                                            <p className="text-violet-300/70 text-xs font-medium">8 world-class AI games • Adaptive difficulty</p>
                                        </div>
                                    </div>
                                    <Link href="/aipoweredgames" className="shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-violet-500/25 active:scale-95 whitespace-nowrap">
                                        Explore →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { icon: '∞', label: 'AI Math', href: '/aipoweredgames/math-ai' },
                                        { icon: '🏆', label: 'Olympiad', href: '/aipoweredgames/adaptive-challenge' },
                                        { icon: '✍️', label: 'Essay AI', href: '/aipoweredgames/essay-ai' },
                                        { icon: '🎯', label: 'Science', href: '/aipoweredgames/science-ai' },
                                        { icon: '🗣️', label: 'Language', href: '/aipoweredgames/language-ai' },
                                        { icon: '🎤', label: 'Debate', href: '/aipoweredgames/debate-ai' },
                                        { icon: '🔭', label: 'Research', href: '/aipoweredgames/research-lab' },
                                        { icon: '🚀', label: 'Projects', href: '/aipoweredgames/project-lab' },
                                    ].map(g => (
                                        <Link key={g.href} href={g.href}
                                            className="flex flex-col items-center gap-1.5 p-2.5 bg-white/5 hover:bg-violet-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 border border-white/5 hover:border-violet-500/30">
                                            <span className="text-xl">{g.icon}</span>
                                            <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">{g.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Play Now CTA */}
                        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="text-5xl">🎮</div>
                                    <div>
                                        <h2 className="text-2xl font-display font-black mb-1">Game Center</h2>
                                        <p className="text-white/50 text-sm font-medium">Brain-boosting games · Earn XP · Climb the board</p>
                                    </div>
                                </div>
                                <Link href="/games" className="shrink-0 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 whitespace-nowrap">
                                    Play Now →
                                </Link>
                            </div>
                        </div>

                        {/* ── BKT Skill Mastery ── */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">🧠 Skill Mastery</h2>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bayesian Knowledge Tracking</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">
                                Your P(L) score = probability you&apos;ve truly learned the skill. Aim for green!
                            </p>

                            {skillMasteries.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="text-4xl mb-3">🎮</div>
                                    <p className="text-slate-400 font-medium text-sm">Play some games to unlock skill mastery tracking!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Overall mastery summary */}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-6">
                                        <div className="text-3xl font-black text-violet-500">{Math.round(avgMastery * 100)}%</div>
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">Overall Average P(L)</div>
                                            <div className={`text-xs font-bold ${masteryTextColor(avgMastery)}`}>{masteryLabel(avgMastery)}</div>
                                        </div>
                                        <div className="ml-auto h-2 w-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${masteryColor(avgMastery)} rounded-full`} style={{ width: `${Math.round(avgMastery * 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Per-skill bars */}
                                    <div className="space-y-3">
                                        {skillMasteries.map((m, i) => (
                                            <div key={m.id}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.skill.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{m.skill.subject}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-black ${masteryTextColor(m.masteryProbability)}`}>
                                                            {Math.round(m.masteryProbability * 100)}%
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.masteryProbability >= 0.75
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                            : m.masteryProbability >= 0.5
                                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                                : m.masteryProbability >= 0.25
                                                                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                                            }`}>
                                                            {masteryLabel(m.masteryProbability)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${masteryColor(m.masteryProbability)} rounded-full transition-all duration-700`}
                                                        style={{ width: `${Math.round(m.masteryProbability * 100)}%`, transitionDelay: `${i * 50}ms` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        {[
                                            { label: '≥75% Proficient', color: 'bg-emerald-500' },
                                            { label: '50% Developing', color: 'bg-amber-400' },
                                            { label: '25% Emerging', color: 'bg-orange-500' },
                                            { label: '<25% Novice', color: 'bg-rose-500' },
                                        ].map(l => (
                                            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                                                {l.label}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Recent Games */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mb-6">Recent Games</h2>
                            {!student?.gameResults.length ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🎮</div>
                                    <p className="text-slate-400 font-medium text-sm">No games played yet. Start playing to earn XP!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {student.gameResults.map((result) => (
                                        <div key={result.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl w-10 text-center">{GAME_ICONS[result.gameType] || '🎮'}</div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{result.gameType.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-slate-400">{shortDate(result.completedAt)} · {Math.round(result.accuracy * 100)}% accuracy</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-emerald-500">+{result.xpEarned} XP</div>
                                                <div className="text-xs text-slate-400">{result.score} pts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Enrolled Classes */}
                        {student?.classesEnrolled && student.classesEnrolled.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mb-6">My Classes</h2>
                                <div className="space-y-3">
                                    {student.classesEnrolled.map(({ class: classItem }) => (
                                        <Link
                                            key={classItem.id}
                                            href={`/dashboard/student/class/${classItem.id}`}
                                            className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 bg-white/50 dark:bg-slate-900/30 transition-all hover:shadow-md group"
                                        >
                                            <div className="text-3xl group-hover:scale-110 transition-transform">{classItem.emoji}</div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {classItem.name}
                                                </h3>
                                                <p className="text-xs text-slate-400">{classItem.teacher.firstName} {classItem.teacher.lastName} · Grade {classItem.grade}</p>
                                            </div>
                                            <Link
                                                href={`/dashboard/student/class/${classItem.id}/leaderboard`}
                                                onClick={e => e.stopPropagation()}
                                                className="shrink-0 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                                            >🏆 Rank</Link>
                                            <div className="text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity text-sm">View →</div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column (1/3) ── */}
                    <div className="space-y-6">

                        {/* Streak Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                            <div className="text-5xl mb-3">🔥</div>
                            <div className="text-5xl font-black text-amber-500 mb-1">{student?.streakData?.currentStreak || 0}</div>
                            <div className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Day Streak</div>
                            <div className="text-xs text-slate-400">Best: {student?.streakData?.longestStreak || 0} days</div>
                            {(student?.streakData?.currentStreak || 0) >= 7 && (
                                <div className="mt-3 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                                    🔥 On Fire! Keep it up
                                </div>
                            )}
                        </div>

                        {/* Mastery Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h3 className="font-display font-black text-slate-900 dark:text-white mb-5">🎯 Mastery Stats</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Skills Tracked', value: skillMasteries.length, icon: '📊' },
                                    {
                                        label: 'Proficient (≥75%)',
                                        value: skillMasteries.filter(m => m.masteryProbability >= 0.75).length,
                                        icon: '✅'
                                    },
                                    {
                                        label: 'Still Learning',
                                        value: skillMasteries.filter(m => m.masteryProbability < 0.5).length,
                                        icon: '📖'
                                    },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            <span>{s.icon}</span> {s.label}
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h3 className="font-display font-black text-slate-900 dark:text-white mb-5">🏆 Recent Badges</h3>
                            <AchievementList badges={student?.badges.map(b => ({
                                id: b.id,
                                name: b.name,
                                description: b.description,
                                type: b.icon,
                                earnedAt: b.earnedAt.toISOString()
                            })) || []} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
