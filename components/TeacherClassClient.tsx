'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Types ────────────────────────────────────────────────────────────────────

interface SkillMastery {
    id: string
    masteryProbability: number
    totalAttempts: number
    consecutiveCorrect: number
    skill: { name: string; code: string; subject: string }
}

interface GameResult {
    id: string
    gameType: string
    score: number
    xpEarned: number
    accuracy: number
    completedAt: Date | string
}

interface Student {
    id: string
    firstName: string
    lastName: string
    xp: number
    level: number
    gameResults: GameResult[]
    skillMasteries: SkillMastery[]
    streakData: { currentStreak: number; longestStreak: number } | null
}

interface ClassData {
    id: string
    name: string
    grade: string
    emoji: string
    classCode: string
    students: { student: Student }[]
    assignments: { id: string; _count: { gameResults: number } }[]
}

interface TeacherClassClientProps {
    classData: ClassData
    totalXP: number
    avgMastery: number
    hasAdvancedFeatures: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function masteryColor(p: number) {
    if (p >= 0.75) return 'bg-emerald-500'
    if (p >= 0.5) return 'bg-amber-400'
    if (p >= 0.25) return 'bg-orange-500'
    return 'bg-rose-500'
}

function masteryLabel(p: number) {
    if (p >= 0.75) return { label: 'Proficient', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' }
    if (p >= 0.5) return { label: 'Developing', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' }
    if (p >= 0.25) return { label: 'Emerging', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' }
    return { label: 'Novice', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' }
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeacherClassClient({ classData, totalXP, avgMastery, hasAdvancedFeatures }: TeacherClassClientProps) {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [view, setView] = useState<'roster' | 'heatmap'>('roster')

    const students = classData.students.map(s => s.student)
    const completionRate = students.length > 0
        ? Math.round((students.filter(s => s.gameResults.length > 0).length / students.length) * 100)
        : 0

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard/teacher" className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition text-sm font-bold flex items-center gap-2">
                        ← Back
                    </Link>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{classData.emoji}</span>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white">{classData.name}</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grade {classData.grade}</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            Code: <span className="text-emerald-500 font-mono">{classData.classCode}</span>
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* ── Summary Bar ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                    {[
                        {
                            icon: '👥', label: 'Students', value: students.length, sub: null,
                            accent: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20'
                        },
                        {
                            icon: '⚡', label: 'Class XP', value: totalXP.toLocaleString(), sub: 'total earned',
                            accent: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20'
                        },
                        {
                            icon: '✅', label: 'Active Rate', value: `${completionRate}%`, sub: 'played at least once',
                            accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20'
                        },
                        {
                            icon: '🧠', label: 'Avg Mastery P(L)', value: `${Math.round(avgMastery * 100)}%`, sub: 'Bayesian KT score',
                            accent: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20'
                        },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                                {stat.icon}
                            </div>
                            <div className={`text-3xl font-black mb-1 ${stat.accent}`}>{stat.value}</div>
                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            {stat.sub && <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>}
                        </div>
                    ))}
                </div>

                {/* ── Class Mastery Bar ── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Class Mastery Distribution — P(L)</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Bayesian Knowledge Tracing across all skills</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${masteryLabel(avgMastery).color}`}>
                            {masteryLabel(avgMastery).label}
                        </div>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${masteryColor(avgMastery)} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.round(avgMastery * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                        <span>0%</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{Math.round(avgMastery * 100)}% avg</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* ── View Toggle ── */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setView('roster')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${view === 'roster' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                    >
                        📋 Student Roster
                    </button>
                    <button
                        onClick={() => setView('heatmap')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${view === 'heatmap' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                    >
                        🗺️ Mastery Heatmap
                    </button>
                </div>

                {view === 'roster' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        {students.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <div className="text-5xl mb-4">🎓</div>
                                <p className="font-bold">No students yet. Share code <span className="text-emerald-500 font-mono">{classData.classCode}</span> to enroll students.</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-700">
                                        <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Level</th>
                                        <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">XP</th>
                                        <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Avg P(L)</th>
                                        <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Streak</th>
                                        <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Last Active</th>
                                        <th className="px-6 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {students.map((student, i) => {
                                        const studentAvgPl = student.skillMasteries.length > 0
                                            ? student.skillMasteries.reduce((a, m) => a + m.masteryProbability, 0) / student.skillMasteries.length
                                            : 0
                                        const lastResult = student.gameResults[0]
                                        const ml = masteryLabel(studentAvgPl)
                                        return (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                                                onClick={() => setSelectedStudent(student)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
                                                            {(student.firstName[0] || '?').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                                {student.firstName} {student.lastName}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {student.skillMasteries.length} skills tracked
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Lv. {student.level}</span>
                                                </td>
                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    <span className="text-sm font-bold text-amber-500">{student.xp.toLocaleString()} XP</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className={`h-full ${masteryColor(studentAvgPl)} rounded-full`} style={{ width: `${Math.round(studentAvgPl * 100)}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ml.color}`}>{ml.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden lg:table-cell">
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        🔥 {student.streakData?.currentStreak ?? 0}d
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 hidden lg:table-cell">
                                                    <span className="text-sm text-slate-400">
                                                        {lastResult ? shortDate(lastResult.completedAt) : 'Never'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-300 dark:text-slate-600 text-lg">→</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {view === 'heatmap' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 overflow-x-auto">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                            Skill Mastery Grid — each cell = P(L) for one student × skill
                        </p>
                        {students.length === 0 ? (
                            <p className="text-center text-slate-400 py-10">No students enrolled yet.</p>
                        ) : (
                            <div className="space-y-3 min-w-[600px]">
                                {/* Header: student names */}
                                <div className="flex gap-2 items-center">
                                    <div className="w-40 shrink-0" />
                                    {students.map(s => (
                                        <div key={s.id} className="w-8 text-center text-xs font-bold text-slate-400 truncate" title={s.firstName}>
                                            {s.firstName[0]}
                                        </div>
                                    ))}
                                </div>
                                {/* Collect all unique skills across class */}
                                {Array.from(new Set(students.flatMap(s => s.skillMasteries.map(m => m.skill.name)))).slice(0, 12).map(skillName => (
                                    <div key={skillName} className="flex gap-2 items-center">
                                        <div className="w-40 shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300 truncate" title={skillName}>
                                            {skillName}
                                        </div>
                                        {students.map(s => {
                                            const mastery = s.skillMasteries.find(m => m.skill.name === skillName)
                                            const pl = mastery?.masteryProbability ?? null
                                            return (
                                                <div
                                                    key={s.id}
                                                    title={pl !== null ? `${s.firstName}: ${Math.round(pl * 100)}%` : `${s.firstName}: No data`}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white transition-all ${pl !== null ? masteryColor(pl) : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                                                >
                                                    {pl !== null ? Math.round(pl * 100) : '—'}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                                {/* Legend */}
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400">
                                    <span>P(L) Legend:</span>
                                    {[
                                        { label: '≥75% Proficient', color: 'bg-emerald-500' },
                                        { label: '50–74% Developing', color: 'bg-amber-400' },
                                        { label: '25–49% Emerging', color: 'bg-orange-500' },
                                        { label: '<25% Novice', color: 'bg-rose-500' },
                                    ].map(l => (
                                        <div key={l.label} className="flex items-center gap-1.5">
                                            <div className={`w-3 h-3 rounded ${l.color}`} />
                                            <span>{l.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── Student Detail Sidebar ── */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedStudent(null)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    {/* Panel */}
                    <div
                        className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Panel Header */}
                        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full flex items-center justify-center text-white font-black">
                                    {selectedStudent.firstName[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                                    <p className="text-xs text-slate-400">Level {selectedStudent.level} · {selectedStudent.xp.toLocaleString()} XP</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl transition">✕</button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Level', value: selectedStudent.level, icon: '⭐' },
                                    { label: 'Streak', value: `${selectedStudent.streakData?.currentStreak ?? 0}d`, icon: '🔥' },
                                    { label: 'Games', value: selectedStudent.gameResults.length, icon: '🎮' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                                        <div className="text-2xl mb-1">{s.icon}</div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white">{s.value}</div>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* BKT Skills */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Skill Mastery — Bayesian P(L)</h4>
                                {selectedStudent.skillMasteries.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No skill records yet. Student needs to play more games.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedStudent.skillMasteries.map((m, i) => {
                                            const ml = masteryLabel(m.masteryProbability)
                                            return (
                                                <div key={i} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.skill.name}</span>
                                                            <span className="text-xs text-slate-400 ml-2">{m.skill.subject}</span>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ml.color}`}>
                                                            {Math.round(m.masteryProbability * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${masteryColor(m.masteryProbability)} rounded-full transition-all duration-500`}
                                                            style={{ width: `${Math.round(m.masteryProbability * 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-400">{m.totalAttempts} attempts · {m.consecutiveCorrect} correct in a row</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent Games */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Recent Sessions</h4>
                                {selectedStudent.gameResults.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No games played yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedStudent.gameResults.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{r.gameType.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-slate-400">{shortDate(r.completedAt)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-amber-500">+{r.xpEarned} XP</div>
                                                    <div className="text-xs text-slate-400">{Math.round(r.accuracy * 100)}% acc</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
