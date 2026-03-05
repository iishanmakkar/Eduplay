'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'

const TOPICS_BY_GRADE: Record<string, string[]> = {
    kg2: ['counting', 'addition', 'subtraction', 'shapes'],
    '35': ['fractions', 'multiplication', 'decimals', 'geometry'],
    '68': ['algebra', 'integers', 'probability', 'statistics'],
    '912': ['calculus', 'trigonometry', 'matrices', 'vectors'],
}

const SESSION_LENGTH = 10

interface Question {
    prompt: string
    answerOptions: string[]
    correctAnswer: string
    explanation: string
}

export default function AILiveMathPage() {
    const [gradeBand, setGradeBand] = useState('68')
    const [topic, setTopic] = useState('algebra')
    const [question, setQuestion] = useState<Question | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [showSummary, setShowSummary] = useState(false)
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
    const hasFetchedRef = useRef(false)

    const fetchQuestion = useCallback(async (gBand = gradeBand, tp = topic) => {
        setLoading(true)
        setSelected(null)
        setFeedback(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'mathematics', topic: tp, gradeBand: gBand, difficulty: 3, questionType: 'mcq' }),
            })
            const data = await res.json()
            if (data.question) setQuestion(data.question)
        } catch {
            setQuestion({
                prompt: 'If a rectangle has length 12 cm and width 8 cm, what is its area?',
                answerOptions: ['80 cm²', '96 cm²', '40 cm²', '100 cm²'],
                correctAnswer: '96 cm²',
                explanation: 'Area = length × width = 12 × 8 = 96 cm²',
            })
        } finally {
            setLoading(false)
        }
    }, [gradeBand, topic])

    // Auto-fetch first question on mount
    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true
            fetchQuestion()
        }
    }, [fetchQuestion])

    const handleSelect = useCallback((opt: string) => {
        if (selected || !question) return
        const correct = opt === question.correctAnswer
        setSelected(opt)
        setFeedback(correct ? 'correct' : 'wrong')
        setTotal(t => t + 1)
        if (correct) {
            setScore(s => s + 10)
            setStreak(s => {
                const ns = s + 1
                setBestStreak(b => Math.max(b, ns))
                return ns
            })
        } else {
            setStreak(0)
        }
        // Check session end
        if (total + 1 >= SESSION_LENGTH) {
            setTimeout(() => setShowSummary(true), 1800)
        }
    }, [selected, question, total])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (showSummary || loading) return
            if (selected !== null && (e.key === 'Enter' || e.key === ' ') && total < SESSION_LENGTH) {
                fetchQuestion()
                return
            }
            if (selected !== null) return
            if (!question) return
            const idx = parseInt(e.key) - 1
            if (idx >= 0 && idx < question.answerOptions.length) {
                handleSelect(question.answerOptions[idx])
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selected, question, handleSelect, fetchQuestion, showSummary, loading, total])

    const resetSession = () => {
        setScore(0); setTotal(0); setStreak(0); setBestStreak(0)
        setShowSummary(false); setQuestion(null); setSelected(null); setFeedback(null)
        fetchQuestion()
    }

    const accuracy = total > 0 ? Math.round((score / (total * 10)) * 100) : 0

    // ── Session Summary ─────────────────────────────────────────────────────
    if (showSummary) {
        const grade = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C'
        const gradeColor = grade === 'S' ? 'text-violet-400' : grade === 'A' ? 'text-emerald-400' : grade === 'B' ? 'text-blue-400' : 'text-amber-400'
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/20 p-6 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 text-center space-y-6">
                        <div className="text-6xl">🎯</div>
                        <div>
                            <div className={`text-7xl font-black ${gradeColor} mb-1`}>{grade}</div>
                            <div className="text-white font-bold text-xl">Session Complete</div>
                            <div className="text-slate-400 text-sm mt-1">{SESSION_LENGTH} questions answered</div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Score', value: score, color: 'text-violet-400' },
                                { label: 'Accuracy', value: `${accuracy}%`, color: 'text-emerald-400' },
                                { label: 'Best Streak', value: `🔥${bestStreak}`, color: 'text-amber-400' },
                            ].map(s => (
                                <div key={s.label} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                                    <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <button onClick={resetSession}
                                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all active:scale-95">
                                Play Again 🚀
                            </button>
                            <Link href="/aipoweredgames"
                                className="block w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-center">
                                ← AI Games Hub
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">← AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-violet-400 text-sm font-medium">AI Math Generator</span>
                </div>

                {/* Header + Stats */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-2xl">∞</div>
                        <div>
                            <h1 className="text-2xl font-black text-white">AI Live Math</h1>
                            <p className="text-slate-400 text-xs">Infinite adaptive questions</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {streak >= 3 && (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-center">
                                <div className="text-lg font-black text-amber-400">🔥 {streak}</div>
                                <div className="text-slate-500 text-xs">Streak</div>
                            </div>
                        )}
                        <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 px-4 py-2 text-center">
                            <div className="text-xl font-black text-violet-400">{score}</div>
                            <div className="text-slate-500 text-xs">{total}/{SESSION_LENGTH}</div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${(total / SESSION_LENGTH) * 100}%` }} />
                </div>

                {/* Controls */}
                <div className="flex gap-3 mb-6">
                    <select value={gradeBand} onChange={e => {
                        const gb = e.target.value
                        setGradeBand(gb)
                        const firstTopic = TOPICS_BY_GRADE[gb]?.[0] ?? 'algebra'
                        setTopic(firstTopic)
                        fetchQuestion(gb, firstTopic)
                    }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500">
                        <option value="kg2">Grade KG-2</option>
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                    <select value={topic} onChange={e => { setTopic(e.target.value); fetchQuestion(gradeBand, e.target.value) }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500">
                        {(TOPICS_BY_GRADE[gradeBand] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-12 text-center">
                        <div className="text-4xl animate-spin mb-4">⟳</div>
                        <p className="text-slate-400">Generating question…</p>
                    </div>
                )}

                {/* Question card */}
                {question && !loading && (
                    <div className={`rounded-2xl border bg-slate-900/60 p-6 space-y-5 transition-all duration-300 ${feedback === 'correct' ? 'border-emerald-500/60' : feedback === 'wrong' ? 'border-red-500/60' : 'border-slate-700/50'
                        }`}>
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map((opt, idx) => {
                                const isSelected = opt === selected
                                const isCorrect = opt === question.correctAnswer
                                let cls = 'relative border-2 rounded-xl p-4 text-sm font-semibold cursor-pointer transition-all duration-200 text-left '
                                if (!selected) {
                                    cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-violet-500 hover:bg-violet-500/10 hover:scale-[1.02]'
                                } else if (isCorrect) {
                                    cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300 scale-[1.02]'
                                } else if (isSelected) {
                                    cls += 'border-red-500 bg-red-500/20 text-red-300'
                                } else {
                                    cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                }
                                return (
                                    <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                                        <span className="absolute top-2 right-2 text-xs text-slate-600 font-mono">{idx + 1}</span>
                                        {isCorrect && selected && <span className="mr-2">✓</span>}
                                        {isSelected && !isCorrect && <span className="mr-2">✗</span>}
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>

                        {selected && (
                            <>
                                <div className={`rounded-xl p-4 border ${feedback === 'correct' ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-red-950/30 border-red-800/50'}`}>
                                    <p className="text-sm">
                                        <span className="text-violet-400 font-bold">Explanation: </span>
                                        <span className="text-slate-300">{question.explanation}</span>
                                    </p>
                                </div>
                                {total < SESSION_LENGTH ? (
                                    <button onClick={() => fetchQuestion()}
                                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-95">
                                        Next Question → <span className="text-violet-300 text-xs ml-1">(or press Enter)</span>
                                    </button>
                                ) : (
                                    <button onClick={() => setShowSummary(true)}
                                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all active:scale-95">
                                        View Session Results 🎯
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Keyboard hint */}
                <p className="text-center text-slate-600 text-xs mt-4">
                    Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">1</kbd>–<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">4</kbd> to answer · <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Enter</kbd> for next
                </p>
            </div>
        </div>
    )
}
