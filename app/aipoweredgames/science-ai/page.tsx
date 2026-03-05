'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'

const SUBJECTS = [
    { value: 'science', label: 'Science', color: 'emerald', topics: ['cells', 'photosynthesis', "Newton's laws", 'periodic table', 'DNA', 'ecosystems', 'optics', 'chemical reactions'] },
    { value: 'social-studies', label: 'Social Studies', color: 'amber', topics: ['World War II', 'democracy', 'ancient Rome', 'geography', 'French Revolution', 'Indian independence'] },
    { value: 'english', label: 'English', color: 'sky', topics: ['grammar', 'comprehension', 'parts of speech', 'idioms', 'figures of speech', 'essay writing'] },
    { value: 'gk', label: 'GK', color: 'violet', topics: ['discoveries', 'world capitals', 'famous inventors', 'current events', 'national symbols'] },
]

const SESSION_LENGTH = 10

interface AIQuestion {
    prompt: string
    answerOptions: string[]
    correctAnswer: string
    explanation: string
    skillTag: string
}

export default function ScienceAIPage() {
    const [subjectKey, setSubjectKey] = useState('science')
    const [gradeBand, setGradeBand] = useState('68')
    const [topic, setTopic] = useState('cells')
    const [question, setQuestion] = useState<AIQuestion | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [history, setHistory] = useState<boolean[]>([])
    const [showSummary, setShowSummary] = useState(false)
    const hasFetchedRef = useRef(false)

    const sub = SUBJECTS.find(s => s.value === subjectKey) ?? SUBJECTS[0]
    const accentColor = `text-${sub.color}-400`
    const borderActiveFocus = `focus:border-${sub.color}-500`

    const fetchQuestion = useCallback(async (sKey = subjectKey, tp = topic, gb = gradeBand) => {
        setLoading(true)
        setSelected(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: sKey, topic: tp, gradeBand: gb, difficulty: 3, questionType: 'mcq' }),
            })
            const data = await res.json()
            if (data.question) setQuestion(data.question)
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [subjectKey, topic, gradeBand])

    // Auto-start on mount
    useEffect(() => {
        if (!hasFetchedRef.current) { hasFetchedRef.current = true; fetchQuestion() }
    }, [fetchQuestion])

    const handleSelect = useCallback((opt: string) => {
        if (selected || !question) return
        const correct = opt === question.correctAnswer
        setSelected(opt)
        setTotal(t => t + 1)
        if (correct) {
            setScore(s => s + 10)
            setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns })
        } else {
            setStreak(0)
        }
        const newHistory = [...history, correct]
        setHistory(newHistory)
        if (newHistory.length >= SESSION_LENGTH) setTimeout(() => setShowSummary(true), 1600)
    }, [selected, question, history])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (showSummary || loading) return
            if (selected !== null && (e.key === 'Enter' || e.key === ' ')) { fetchQuestion(); return }
            if (selected !== null || !question) return
            const idx = parseInt(e.key) - 1
            if (idx >= 0 && idx < (question.answerOptions?.length ?? 0)) handleSelect(question.answerOptions[idx])
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selected, question, handleSelect, fetchQuestion, showSummary, loading])

    const resetSession = () => {
        setScore(0); setTotal(0); setStreak(0); setBestStreak(0); setHistory([])
        setShowSummary(false); setQuestion(null); setSelected(null)
        fetchQuestion()
    }

    // Session Summary
    if (showSummary) {
        const correct = history.filter(Boolean).length
        const pct = Math.round((correct / SESSION_LENGTH) * 100)
        const grade = pct >= 90 ? 'S' : pct >= 70 ? 'A' : pct >= 50 ? 'B' : 'C'
        const gradeColor = grade === 'S' ? 'text-violet-400' : grade === 'A' ? 'text-emerald-400' : grade === 'B' ? 'text-blue-400' : 'text-amber-400'
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-6 flex items-center justify-center">
                <div className="max-w-md w-full rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 text-center space-y-6">
                    <div className="text-6xl">🎯</div>
                    <div>
                        <div className={`text-7xl font-black ${gradeColor} mb-1`}>{grade}</div>
                        <div className="text-white font-bold text-xl">Session Complete</div>
                        <div className="text-slate-400 text-sm mt-1">{sub.label} · {topic} · Grade {gradeBand}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Score', value: score, color: 'text-emerald-400' },
                            { label: 'Accuracy', value: `${pct}%`, color: 'text-sky-400' },
                            { label: 'Best Streak', value: `🔥${bestStreak}`, color: 'text-amber-400' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 justify-center">
                        {history.map((h, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${h ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        ))}
                    </div>
                    <div className="space-y-3">
                        <button onClick={resetSession} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95">
                            Play Again 🚀
                        </button>
                        <Link href="/aipoweredgames" className="block w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-center">
                            ← AI Games Hub
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Breadcrumb + stats */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">← AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className={`${accentColor} text-sm font-medium`}>Weakness Trainer</span>
                    <div className="ml-auto flex gap-3 items-center">
                        {streak >= 3 && (
                            <span className="text-amber-400 font-black text-sm">🔥 {streak}</span>
                        )}
                        <div className="text-right">
                            <div className={`text-xl font-black ${accentColor}`}>{score}</div>
                            <div className="text-slate-500 text-xs">{total}/{SESSION_LENGTH}</div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(total / SESSION_LENGTH) * 100}%` }} />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl">🎯</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Weakness Trainer</h1>
                        <p className="text-slate-400 text-sm">Targeted practice on exactly what you need to improve</p>
                    </div>
                </div>

                {/* Subject tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {SUBJECTS.map(s => (
                        <button key={s.value} onClick={() => {
                            setSubjectKey(s.value)
                            const t = s.topics[0]
                            setTopic(t)
                            fetchQuestion(s.value, t, gradeBand)
                        }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${subjectKey === s.value
                                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex gap-3 mb-6">
                    <select value={topic} onChange={e => { setTopic(e.target.value); fetchQuestion(subjectKey, e.target.value, gradeBand) }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                        {sub.topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={gradeBand} onChange={e => { setGradeBand(e.target.value); fetchQuestion(subjectKey, topic, e.target.value) }}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-12 text-center">
                        <div className="text-4xl animate-spin mb-4">⟳</div>
                        <p className="text-slate-400">Finding your weak spot…</p>
                    </div>
                )}

                {/* Question card */}
                {question && !loading && (
                    <div className={`rounded-2xl border bg-slate-900/60 p-6 space-y-5 transition-all ${selected ? (selected === question.correctAnswer ? 'border-emerald-500/60' : 'border-red-500/60') : 'border-slate-700/50'}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-full">{question.skillTag}</span>
                        </div>
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map((opt, idx) => {
                                const isSelected = opt === selected
                                const isCorrect = opt === question.correctAnswer
                                let cls = 'relative border-2 rounded-xl p-4 text-sm font-medium cursor-pointer transition-all text-left '
                                if (!selected) cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-emerald-500 hover:bg-emerald-500/10 hover:scale-[1.02]'
                                else if (isCorrect) cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300 scale-[1.02]'
                                else if (isSelected) cls += 'border-red-500 bg-red-500/20 text-red-300'
                                else cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                return (
                                    <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                                        <span className="absolute top-2 right-2 text-xs text-slate-600 font-mono">{idx + 1}</span>
                                        {isCorrect && selected && <span className="mr-1">✓</span>}
                                        {isSelected && !isCorrect && <span className="mr-1">✗</span>}
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                        {selected && (
                            <>
                                <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
                                    <p className="text-sm text-slate-300">
                                        <span className="text-emerald-400 font-bold">Explanation: </span>
                                        {question.explanation}
                                    </p>
                                </div>
                                {total < SESSION_LENGTH ? (
                                    <button onClick={() => fetchQuestion()} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all active:scale-95">
                                        Next Question → <span className="text-emerald-300 text-xs ml-1">(or press Enter)</span>
                                    </button>
                                ) : (
                                    <button onClick={() => setShowSummary(true)} className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-all active:scale-95">
                                        View Session Results 🎯
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                <p className="text-center text-slate-600 text-xs mt-4">
                    Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">1</kbd>–<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">4</kbd> to answer · <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Enter</kbd> for next
                </p>
            </div>
        </div>
    )
}
