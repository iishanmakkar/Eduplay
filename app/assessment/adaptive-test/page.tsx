'use client'

import { useState, useCallback } from 'react'

interface Question {
    id: string
    prompt: string
    options: string[]
    difficultyTier: number
}

interface TestSummary {
    theta: number
    thetaSE: number
    percentile: number
    accuracy: number
    totalItems: number
    correctItems: number
    durationSeconds: number
    masteryStatus: string
    confidenceInterval: [number, number]
}

const SUBJECT_OPTIONS = [
    { value: 'general', label: 'All Subjects' },
    { value: 'number-sense', label: 'Number Sense' },
    { value: 'algebra', label: 'Algebra' },
    { value: 'geometry', label: 'Geometry' },
    { value: 'fractions', label: 'Fractions' },
    { value: 'statistics', label: 'Statistics & Probability' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
]

function AbilityMeter({ theta, se }: { theta: number; se: number }) {
    // Map θ (-3 to +3) to 0–100%
    const pct = Math.round(((theta + 3) / 6) * 100)
    const lowPct = Math.round(((theta - 1.96 * se + 3) / 6) * 100)
    const highPct = Math.round(((theta + 1.96 * se + 3) / 6) * 100)

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>θ = {theta.toFixed(2)}</span>
                <span>SE = {se.toFixed(2)}</span>
            </div>
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                {/* CI band */}
                <div
                    className="absolute h-full bg-violet-500/20 rounded-full"
                    style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
                />
                {/* θ marker */}
                <div
                    className="absolute h-full w-1 bg-violet-400 rounded-full"
                    style={{ left: `${pct}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>Low</span><span>Average</span><span>High</span>
            </div>
        </div>
    )
}

function MasteryBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string }> = {
        advanced: { label: 'Advanced', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        mastered: { label: 'Mastered', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        approaching: { label: 'Approaching', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        learning: { label: 'Learning', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    }
    const c = config[status] ?? config.learning
    return (
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${c.color}`}>
            {c.label}
        </span>
    )
}

export default function AdaptiveTestPage() {
    const [phase, setPhase] = useState<'setup' | 'testing' | 'results'>('setup')
    const [skillTag, setSkillTag] = useState('general')
    const [sessionId, setSessionId] = useState('')
    const [question, setQuestion] = useState<Question | null>(null)
    const [itemNumber, setItemNumber] = useState(1)
    const [theta, setTheta] = useState(0)
    const [thetaSE, setThetaSE] = useState(1.0)
    const [selected, setSelected] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [summary, setSummary] = useState<TestSummary | null>(null)
    const [loading, setLoading] = useState(false)
    const [startTime, setStartTime] = useState(0)

    const startTest = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/assessment/adaptive-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', skillTag }),
            })
            const data = await res.json()
            setSessionId(data.sessionId)
            setQuestion(data.question)
            setItemNumber(1)
            setTheta(data.theta ?? 0)
            setThetaSE(data.thetaSE ?? 1.0)
            setStartTime(Date.now())
            setPhase('testing')
        } finally {
            setLoading(false)
        }
    }

    const submitAnswer = async () => {
        if (!selected || !question || submitted) return
        setSubmitted(true)
        const timeTakenMs = Date.now() - startTime

        const res = await fetch('/api/assessment/adaptive-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'answer', sessionId,
                questionId: question.id,
                correct: selected === '[CORRECT]',  // NOTE: In real impl, validate server-side
                timeTakenMs,
            }),
        })
        const data = await res.json()

        if (data.done) {
            setSummary(data.summary)
            setPhase('results')
            return
        }

        setTimeout(() => {
            setQuestion(data.question)
            setItemNumber(data.itemNumber)
            setTheta(data.theta)
            setThetaSE(data.thetaSE)
            setSelected(null)
            setSubmitted(false)
            setIsCorrect(null)
            setStartTime(Date.now())
        }, 800)
    }

    // ── Setup Phase ──────────────────────────────────────────────────────────
    if (phase === 'setup') return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🧠</div>
                    <h1 className="text-3xl font-black text-white mb-2">Adaptive Assessment</h1>
                    <p className="text-slate-400 text-sm">
                        20–30 questions · Difficulty auto-adjusts · Stops when confident
                    </p>
                    <div className="mt-3 inline-flex gap-4 text-xs text-slate-500">
                        <span>IRT 3PL Calibrated</span>
                        <span>·</span>
                        <span>EAP θ Estimation</span>
                        <span>·</span>
                        <span>MAP-Growth Style</span>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-6">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Subject Area</label>
                    <select
                        value={skillTag}
                        onChange={e => setSkillTag(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 mb-6 text-sm"
                    >
                        {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    <div className="space-y-2 mb-6 text-xs text-slate-500">
                        <div className="flex items-center gap-2"><span className="text-violet-400">✓</span> Calibrated difficulty adjusts to your ability in real time</div>
                        <div className="flex items-center gap-2"><span className="text-violet-400">✓</span> Stops automatically when measurement is precise enough</div>
                        <div className="flex items-center gap-2"><span className="text-violet-400">✓</span> Provides percentile rank and mastery confidence interval</div>
                    </div>

                    <button
                        onClick={startTest}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black text-base transition-all"
                    >
                        {loading ? 'Initialising...' : 'Begin Adaptive Assessment →'}
                    </button>
                </div>
            </div>
        </div>
    )

    // ── Testing Phase ────────────────────────────────────────────────────────
    if (phase === 'testing' && question) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-xl mx-auto">
                {/* Progress header */}
                <div className="flex items-center justify-between mb-6">
                    <span className="text-slate-500 text-sm font-mono">Item {itemNumber}</span>
                    <span className="text-slate-600 text-xs">SE = {thetaSE.toFixed(2)} · target &lt;0.30</span>
                    <span className="text-slate-500 text-sm font-mono">Tier {question.difficultyTier}/5</span>
                </div>

                {/* θ meter */}
                <div className="mb-6">
                    <AbilityMeter theta={theta} se={thetaSE} />
                </div>

                {/* Question */}
                <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-6 mb-5">
                    <p className="text-white text-lg font-medium leading-relaxed">{question.prompt}</p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {question.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => !submitted && setSelected(opt)}
                            disabled={submitted}
                            className={`w-full text-left px-5 py-4 rounded-2xl border font-medium text-sm transition-all ${selected === opt
                                    ? 'border-violet-500 bg-violet-500/10 text-white'
                                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60'
                                }`}
                        >
                            <span className="text-slate-500 font-mono mr-3">{String.fromCharCode(65 + i)}.</span>
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    onClick={submitAnswer}
                    disabled={!selected || submitted}
                    className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white font-black text-sm transition-all"
                >
                    {submitted ? 'Processing...' : 'Submit Answer'}
                </button>
            </div>
        </div>
    )

    // ── Results Phase ────────────────────────────────────────────────────────
    if (phase === 'results' && summary) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-3">📊</div>
                    <h1 className="text-2xl font-black text-white">Assessment Complete</h1>
                    <p className="text-slate-400 text-sm mt-1">Measurement precision achieved</p>
                </div>

                {/* θ score */}
                <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/80 p-6 mb-4 text-center">
                    <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Ability Score (θ)</div>
                    <div className="text-5xl font-black text-indigo-400 mb-1">{summary.theta > 0 ? '+' : ''}{summary.theta}</div>
                    <div className="text-slate-500 text-xs mb-4">95% CI: [{summary.confidenceInterval[0]}, {summary.confidenceInterval[1]}]</div>
                    <AbilityMeter theta={summary.theta} se={summary.thetaSE} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
                        <div className="text-2xl font-black text-amber-400">{summary.percentile}<sup className="text-sm">th</sup></div>
                        <div className="text-slate-500 text-xs mt-0.5">Percentile</div>
                    </div>
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
                        <div className="text-2xl font-black text-emerald-400">{summary.accuracy}%</div>
                        <div className="text-slate-500 text-xs mt-0.5">Accuracy</div>
                    </div>
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
                        <div className="text-2xl font-black text-blue-400">{summary.totalItems}</div>
                        <div className="text-slate-500 text-xs mt-0.5">Items Used</div>
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <MasteryBadge status={summary.masteryStatus} />
                </div>

                <button
                    onClick={() => { setPhase('setup'); setSummary(null); setQuestion(null) }}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all"
                >
                    Retake Assessment
                </button>
            </div>
        </div>
    )

    return null
}
