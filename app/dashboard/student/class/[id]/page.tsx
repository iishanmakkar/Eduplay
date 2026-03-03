import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function StudentClassPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'STUDENT') {
        redirect('/auth/signin')
    }

    const classData = await prisma.class.findUnique({
        where: { id: params.id },
        include: {
            teacher: true,
            assignments: {
                where: {
                    dueDate: {
                        gte: new Date(),
                    },
                },
                orderBy: { dueDate: 'asc' },
                include: {
                    gameResults: {
                        where: { studentId: session.user.id },
                    },
                },
            },
            students: {
                where: { studentId: session.user.id },
            },
        },
    })

    if (!classData || classData.students.length === 0) {
        redirect('/dashboard/student')
    }

    // Get student's performance in this class
    const studentResults = await prisma.gameResult.findMany({
        where: {
            studentId: session.user.id,
            assignment: {
                classId: params.id,
            },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
    })

    const totalXP = studentResults.reduce((acc, r) => acc + r.xpEarned, 0)

    return (
        <div className="min-h-screen bg-surface dark:bg-background transition-colors duration-300">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald to-sky text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <Link
                        href="/dashboard/student"
                        className="text-sm font-semibold text-white/80 hover:text-white transition mb-6 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="text-7xl drop-shadow-lg">{classData.emoji}</div>
                            <div>
                                <h1 className="text-4xl font-display font-bold mb-1">{classData.name}</h1>
                                <p className="text-emerald-50 font-medium">
                                    {classData.teacher.firstName} {classData.teacher.lastName} • Grade {classData.grade}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 min-w-[140px]">
                            <div className="text-4xl font-black">{totalXP.toLocaleString()}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-emerald-50">XP Earned</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Assignments */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 p-8 shadow-sm transition-colors">
                            <h2 className="text-2xl font-display font-bold mb-6 text-slate-900 dark:text-white">Active Assignments</h2>
                            {classData.assignments.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="text-6xl mb-4">📝</div>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">No active assignments</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Check back later for new adventures!</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {classData.assignments.map((assignment) => {
                                        const isCompleted = assignment.gameResults.length > 0
                                        const daysUntilDue = Math.ceil(
                                            (new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        )

                                        return (
                                            <div
                                                key={assignment.id}
                                                className={`border-2 rounded-2xl p-6 transition-all ${isCompleted
                                                    ? 'border-emerald/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                    : daysUntilDue <= 2
                                                        ? 'border-coral/50 bg-coral-50/50 dark:bg-coral-900/10'
                                                        : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                                            {assignment.title}
                                                        </h3>
                                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{assignment.description}</p>
                                                    </div>
                                                    {isCompleted && (
                                                        <div className="bg-emerald-500 text-white p-1 rounded-full text-xl">✅</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                            <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                        {daysUntilDue <= 2 && !isCompleted && (
                                                            <span className="text-sm font-black text-coral animate-pulse-subtle">
                                                                ⏰ {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!isCompleted && (
                                                        <Link
                                                            href={`/games/play?type=${assignment.gameType}&assignment=${assignment.id}`}
                                                            className="w-full sm:w-auto px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                                                        >
                                                            Start Now →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 p-8 shadow-sm transition-colors">
                            <h2 className="text-2xl font-display font-bold mb-6 text-slate-900 dark:text-white">Class History</h2>
                            {studentResults.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">🎮</div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No results recorded in this class yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {studentResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors border border-transparent dark:border-slate-700/50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl">
                                                    {result.gameType === 'SPEED_MATH' && '🔢'}
                                                    {result.gameType === 'SCIENCE_QUIZ' && '🔬'}
                                                    {result.gameType === 'WORLD_FLAGS' && '🌍'}
                                                    {result.gameType === 'MEMORY_MATCH' && '🧠'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {result.gameType.replace('_', ' ')}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {new Date(result.completedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-emerald-500 text-lg">+{result.xpEarned} XP</div>
                                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                                    {Math.round(result.accuracy * 100)}% accuracy
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 p-8 shadow-sm transition-colors">
                            <h3 className="font-display font-bold text-xl mb-6 text-slate-900 dark:text-white">Quick Actions</h3>
                            <div className="space-y-4">
                                <Link
                                    href="/games"
                                    className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">🎮</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Play Games</span>
                                </Link>
                                <Link
                                    href="/dashboard/student"
                                    className="flex items-center gap-4 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl hover:bg-sky-100 dark:hover:bg-sky-900/20 transition group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
                                    <span className="font-bold text-sky-700 dark:text-sky-400">Daily Challenge</span>
                                </Link>
                            </div>
                        </div>

                        {/* Class Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 p-8 shadow-sm transition-colors">
                            <h3 className="font-display font-bold text-xl mb-6 text-slate-900 dark:text-white">Class Info</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Subject</div>
                                    <div className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg inline-block">{classData.subject}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Grade</div>
                                    <div className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg inline-block">{classData.grade}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Teacher</div>
                                    <div className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg inline-block">
                                        {classData.teacher.firstName} {classData.teacher.lastName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
