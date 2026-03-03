'use client'

import Link from 'next/link'

interface SessionSummary {
    gameKey: string
    gameName: string
    score: number
    totalQuestions: number
    correctAnswers: number
    streakMax: number
    totalTimeSeconds: number
    difficulty: number
    skillTag: string
    topicBreakdown: { topic: string; correct: number; total: number }[]
    masteryDelta: number   // % change in skill mastery
    bloomsLevel: string
}

interface Props {
    summary: SessionSummary
    gradeBand?: string
    onRetry?: () => void
    onNextGame?: () => void
}

function GradeBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.round((value / max) * 100)
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <span className="text-xs font-mono text-slate-400 w-8 text-right">{pct}%</span>
        </div>
    )
}

function MetricCard({ label, value, sub, color = 'text-white' }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{label}</div>
            {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
        </div>
    )
}

function getGrade(accuracy: number): { label: string; color: string } {
    if (accuracy >= 0.95) return { label: 'S', color: 'text-amber-400' }
    if (accuracy >= 0.85) return { label: 'A', color: 'text-emerald-400' }
    if (accuracy >= 0.70) return { label: 'B', color: 'text-blue-400' }
    if (accuracy >= 0.55) return { label: 'C', color: 'text-yellow-400' }
    if (accuracy >= 0.40) return { label: 'D', color: 'text-orange-400' }
    return { label: 'F', color: 'text-red-400' }
}

function getWeaknessMessage(topicBreakdown: SessionSummary['topicBreakdown']): string {
    const sorted = [...topicBreakdown].sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
    const weakest = sorted[0]
    if (!weakest || weakest.correct / weakest.total > 0.7) return 'No significant weaknesses detected in this session.'
    return `Priority improvement area: ${weakest.topic} (${weakest.correct}/${weakest.total} correct — ${Math.round((weakest.correct / weakest.total) * 100)}%)`
}

function getTimeEfficiency(totalTimeSeconds: number, totalQuestions: number): { score: number; label: string } {
    const avgSec = totalTimeSeconds / totalQuestions
    if (avgSec < 8) return { score: 98, label: 'Elite Speed' }
    if (avgSec < 15) return { score: 85, label: 'High Efficiency' }
    if (avgSec < 25) return { score: 70, label: 'Adequate' }
    if (avgSec < 40) return { score: 50, label: 'Needs Improvement' }
    return { score: 30, label: 'Slow Response Time' }
}

export default function PostSessionDashboard({ summary, gradeBand = '68', onRetry, onNextGame }: Props) {
    const accuracy = summary.correctAnswers / summary.totalQuestions
    const { label: grade, color: gradeColor } = getGrade(accuracy)
    const timeEff = getTimeEfficiency(summary.totalTimeSeconds, summary.totalQuestions)
    const avgSecPerQ = Math.round(summary.totalTimeSeconds / summary.totalQuestions)

    const isIntellectual = ['68', '912'].includes(gradeBand)
    const sessionCompleteLabel = isIntellectual ? 'Session Complete — Review & Optimise' : 'Session Complete! 🎉'

    const SUBJECT_COLORS: Record<string, string> = {
        mathematics: '#6366f1',
        science: '#10b981',
        english: '#f59e0b',
        history: '#ef4444',
        'computer-science': '#8b5cf6',
    }
    const subjectColor = SUBJECT_COLORS[summary.gameKey?.toLowerCase()] ?? '#6366f1'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">{grade === 'S' ? '🏆' : grade === 'A' ? '⭐' : grade === 'F' ? '📚' : '🎯'}</div>
                    <h1 className="text-2xl font-black text-white mb-1">{sessionCompleteLabel}</h1>
                    <p className="text-slate-400 text-sm">{summary.gameName} · {summary.skillTag}</p>
                </div>

                {/* Grade + Score hero */}
                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-6 mb-5 text-center relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{ background: `radial-gradient(circle at 50% 50%, ${subjectColor}, transparent 70%)` }}
                    />
                    <div className={`text-7xl font-black ${gradeColor} mb-1`}>{grade}</div>
                    <div className="text-slate-400 text-xs mb-4 uppercase tracking-widest">Performance Grade</div>
                    <div className="text-3xl font-black text-white mb-1">{summary.score.toLocaleString()} pts</div>
                    <div className="text-slate-500 text-xs">
                        {summary.correctAnswers}/{summary.totalQuestions} correct · {Math.round(accuracy * 100)}% accuracy
                    </div>
                    {summary.masteryDelta > 0 && (
                        <div className="mt-3 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-emerald-400 text-xs font-bold">
                            +{summary.masteryDelta}% mastery in {summary.skillTag}
                        </div>
                    )}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                    <MetricCard label="Streak" value={summary.streakMax} sub="max" color="text-amber-400" />
                    <MetricCard label="Avg Time" value={`${avgSecPerQ}s`} sub="per question" color={avgSecPerQ < 15 ? 'text-emerald-400' : 'text-slate-300'} />
                    <MetricCard label="Time Eff." value={timeEff.score} sub={timeEff.label} color={timeEff.score >= 80 ? 'text-emerald-400' : 'text-amber-400'} />
                    <MetricCard label="Difficulty" value={`${summary.difficulty}/5`} sub="level" color="text-violet-400" />
                </div>

                {/* Accuracy by topic */}
                {summary.topicBreakdown.length > 0 && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 mb-5">
                        <h3 className="text-white font-bold text-sm mb-4">Accuracy by Topic</h3>
                        <div className="space-y-3">
                            {summary.topicBreakdown.map(t => (
                                <div key={t.topic}>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                        <span className="capitalize">{t.topic}</span>
                                        <span className="font-mono">{t.correct}/{t.total}</span>
                                    </div>
                                    <GradeBar value={t.correct} max={t.total} color={subjectColor} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weakness vector */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-5">
                    <p className="text-amber-400 text-xs font-bold mb-1">Weakness Vector</p>
                    <p className="text-slate-300 text-sm">{getWeaknessMessage(summary.topicBreakdown)}</p>
                </div>

                {/* Suggested path */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-6">
                    <p className="text-violet-400 text-xs font-bold mb-1">Suggested Practice Path</p>
                    <p className="text-slate-300 text-sm">
                        Continue strengthening <span className="text-white font-medium">{summary.skillTag}</span> through the AI Weakness Trainer.
                        {summary.bloomsLevel && ` Your responses show ${summary.bloomsLevel}-level cognitive engagement.`}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all"
                        >
                            Retry Session
                        </button>
                    )}
                    {onNextGame && (
                        <button
                            onClick={onNextGame}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                            style={{ background: subjectColor }}
                        >
                            Next Challenge →
                        </button>
                    )}
                    {!onRetry && !onNextGame && (
                        <Link href="/games" className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm text-center transition-all">
                            Return to Games →
                        </Link>
                    )}
                </div>

            </div>
        </div>
    )
}
