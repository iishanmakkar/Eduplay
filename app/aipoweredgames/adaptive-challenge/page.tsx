'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface AdaptiveQuestion {
    prompt: string
    answerOptions: string[]
    correctAnswer: string
    explanation: string
    skillTag: string
    difficulty: number
}

const SUBJECTS = ['mathematics', 'science', 'english', 'social-studies', 'computer-science']
const GRADE_BANDS = [
    { value: '35', label: 'Grade 3-5' },
    { value: '68', label: 'Grade 6-8' },
    { value: '912', label: 'Grade 9-12' },
]
const TOPICS: Record<string, string[]> = {
    mathematics: ['arithmetic', 'fractions', 'algebra', 'geometry', 'calculus'],
    science: ['biology', 'chemistry', 'physics', 'earth science'],
    english: ['grammar', 'comprehension', 'vocabulary', 'essay writing'],
    'social-studies': ['history', 'geography', 'civics', 'economics'],
    'computer-science': ['algorithms', 'data structures', 'binary', 'networking'],
}

export default function AdaptiveChallengePage() {
    const [subject, setSubject] = useState('mathematics')
    const [topic, setTopic] = useState('algebra')
    const [gradeBand, setGradeBand] = useState('68')
    const [difficulty, setDifficulty] = useState(3)
    const [question, setQuestion] = useState<AdaptiveQuestion | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [total, setTotal] = useState(0)
    const [history, setHistory] = useState<{ correct: boolean; difficulty: number }[]>([])

    const fetchQuestion = useCallback(async () => {
        setLoading(true)
        setSelected(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, gradeBand, difficulty, questionType: 'mcq' }),
            })
            const data = await res.json()
            if (data.question) setQuestion({ ...data.question, difficulty })
        } catch { /* ignore */ }
        setLoading(false)
    }, [subject, topic, gradeBand, difficulty])

    const handleSelect = (opt: string) => {
        if (selected || !question) return
        const correct = opt === question.correctAnswer
        setSelected(opt)
        setTotal(t => t + 1)
        if (correct) {
            setScore(s => s + (difficulty * 20))
            setStreak(s => s + 1)
            setDifficulty(d => Math.min(5, d + (streak >= 2 ? 1 : 0)))  // Adaptive: increase after streak
        } else {
            setStreak(0)
            setDifficulty(d => Math.max(1, d - 1))
        }
        setHistory(h => [...h, { correct, difficulty }])
    }

    const accuracy = total > 0 ? Math.round((score / (total * 3 * 20)) * 100) : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-amber-400 text-sm font-medium">Adaptive Olympiad</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">&#127942;</div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-white">AI Adaptive Olympiad</h1>
                        <p className="text-slate-400 text-sm">Difficulty auto-adjusts to your real-time performance</p>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Score', value: score, color: 'text-amber-400' },
                        { label: 'Streak', value: streak, color: 'text-emerald-400' },
                        { label: 'Difficulty', value: `${difficulty}/5`, color: 'text-violet-400' },
                        { label: 'Questions', value: total, color: 'text-blue-400' },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-3 text-center">
                            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(TOPICS[e.target.value]?.[0] ?? '') }}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-amber-500">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={topic} onChange={e => setTopic(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-amber-500">
                        {(TOPICS[subject] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-amber-500">
                        {GRADE_BANDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                </div>

                <button onClick={fetchQuestion} disabled={loading}
                    className="w-full mb-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm disabled:opacity-50">
                    {loading ? 'Generating...' : question ? 'Next Question' : 'Start Olympiad'}
                </button>

                {question && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-full">
                                {question.skillTag}
                            </span>
                            <span className="text-xs text-slate-500">Difficulty: {'*'.repeat(difficulty)}</span>
                        </div>
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map(opt => {
                                let cls = 'border-2 rounded-xl p-4 text-sm font-medium cursor-pointer transition-all '
                                if (!selected) cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-amber-500 hover:bg-amber-500/10'
                                else if (opt === question.correctAnswer) cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                else if (opt === selected) cls += 'border-red-500 bg-red-500/20 text-red-300'
                                else cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                return <button key={opt} className={cls} onClick={() => handleSelect(opt)}>{opt}</button>
                            })}
                        </div>
                        {selected && (
                            <>
                                <div className="rounded-xl bg-slate-800/60 p-4">
                                    <p className="text-sm text-slate-300">
                                        <span className="text-amber-400 font-bold">Explanation: </span>
                                        {question.explanation}
                                    </p>
                                </div>
                                <button onClick={fetchQuestion}
                                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm">
                                    Next (Difficulty: {difficulty}/5) &#8594;
                                </button>
                            </>
                        )}
                    </div>
                )}

                {!question && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <div className="text-5xl mb-4">&#127942;</div>
                        <p>Questions adapt to your skill level in real-time</p>
                    </div>
                )}
            </div>
        </div>
    )
}
