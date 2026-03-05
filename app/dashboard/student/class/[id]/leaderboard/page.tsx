import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ClassLeaderboardPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') redirect('/auth/signin')

    // Verify student is enrolled in this class
    const enrollment = await prisma.classEnrollment.findFirst({
        where: { userId: session.user.id, classId: params.id }
    })
    if (!enrollment) redirect('/dashboard/student')

    const classData = await prisma.class.findUnique({
        where: { id: params.id },
        include: {
            teacher: { select: { firstName: true, lastName: true } },
            students: {
                include: {
                    student: {
                        select: {
                            id: true, firstName: true, xp: true, level: true,
                            streakData: { select: { currentStreak: true } },
                            gameResults: {
                                where: { completedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
                                select: { xpEarned: true }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!classData) redirect('/dashboard/student')

    const rankedStudents = classData.students
        .map(({ student: s }) => ({
            ...s,
            weeklyXP: s.gameResults.reduce((a, g) => a + g.xpEarned, 0),
            isMe: s.id === session.user.id,
        }))
        .sort((a, b) => b.weeklyXP - a.weeklyXP)

    const myRank = rankedStudents.findIndex(s => s.isMe) + 1
    const myData = rankedStudents.find(s => s.isMe)

    function medalEmoji(rank: number) {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return null
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard/student" className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-sm flex items-center gap-1 transition">
                        ← Dashboard
                    </Link>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">{classData.emoji}</span>
                        <div>
                            <h1 className="font-black text-slate-900 dark:text-white text-sm">{classData.name}</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Weekly Leaderboard</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* My Rank Banner */}
                {myData && (
                    <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-emerald-100/70 text-xs font-bold uppercase tracking-widest mb-1">Your Position</div>
                                <div className="text-5xl font-black">#{myRank}</div>
                                <div className="text-emerald-100 text-sm font-medium mt-1">of {rankedStudents.length} students this week</div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black">{myData.weeklyXP.toLocaleString()}</div>
                                <div className="text-emerald-100/70 text-xs font-bold uppercase tracking-wider">XP This Week</div>
                                {myData.streakData?.currentStreak ? (
                                    <div className="text-amber-200 text-sm font-bold mt-2">🔥 {myData.streakData.currentStreak}d streak</div>
                                ) : null}
                            </div>
                        </div>
                        {myRank <= 3 && (
                            <div className="mt-4 text-sm font-bold text-white/80">
                                {medalEmoji(myRank)} You're on the podium! Keep playing to stay ahead.
                            </div>
                        )}
                        {myRank > 3 && myRank <= 6 && (
                            <div className="mt-4 text-sm font-bold text-white/80">
                                Just {rankedStudents[2]?.weeklyXP - myData.weeklyXP} XP away from the podium 🎯
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="font-display font-black text-slate-900 dark:text-white text-lg">This Week&apos;s Rankings</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Resets every Monday · Based on XP earned in the last 7 days</p>
                    </div>

                    {rankedStudents.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <div className="text-5xl mb-4">🏆</div>
                            <p className="font-medium">No activity yet this week. Be the first to play!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {rankedStudents.map((student, idx) => {
                                const rank = idx + 1
                                const medal = medalEmoji(rank)
                                return (
                                    <div key={student.id}
                                        className={`flex items-center gap-4 px-6 py-4 transition-colors ${student.isMe ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/20'}`}>
                                        {/* Rank */}
                                        <div className={`w-8 text-center font-black text-lg shrink-0 ${rank <= 3 ? 'text-2xl' : 'text-slate-400 dark:text-slate-600'}`}>
                                            {medal ?? rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${student.isMe
                                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2'
                                            : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}>
                                            {student.firstName[0].toUpperCase()}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${student.isMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                {student.firstName} {student.isMe ? '(You)' : ''}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Level {student.level}
                                                {student.streakData?.currentStreak ? ` · 🔥${student.streakData.currentStreak}d` : ''}
                                            </div>
                                        </div>

                                        {/* XP */}
                                        <div className="text-right shrink-0">
                                            <div className={`font-black text-sm ${rank === 1 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {student.weeklyXP.toLocaleString()} XP
                                            </div>
                                            {student.weeklyXP === 0 && (
                                                <div className="text-xs text-slate-400">No games yet</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-6 text-center">
                    <Link href="/games" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
                        🎮 Play Games to Climb!
                    </Link>
                </div>
            </main>
        </div>
    )
}
