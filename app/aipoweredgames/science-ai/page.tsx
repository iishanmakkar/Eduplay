'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface AIQuestion {
    prompt: string
    answerOptions: string[]
    correctAnswer: string
    explanation: string
    skillTag: string
    difficultyLevel?: number
}

interface SkillGap { skill: string; masteryLevel: number; priority: string }
interface WeaknessProfile { recommendedTopics: string[]; skillGaps: SkillGap[] }

export default function ScienceAIPage() {
    const [subject, setSubject] = useState<'science' | 'social-studies' | 'english' | 'gk'>('science')
    const [gradeBand, setGradeBand] = useState('68')
    const [topic, setTopic] = useState('')
    const [profile, setProfile] = useState<WeaknessProfile | null>(null)
    const [question, setQuestion] = useState<AIQuestion | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)

    const SUBJECT_TOPICS: Record<string, string[]> = {
        science: ['cells', 'photosynthesis', 'Newton\'s laws', 'periodic table', 'DNA', 'ecosystems'],
        'social-studies': ['World War II', 'democracy', 'ancient Rome', 'geography', 'trade routes'],
        english: ['grammar', 'comprehension', 'parts of speech', 'idioms', 'essay writing'],
        gk: ['discoveries', 'capitals', 'current events', 'famous people', 'inventions'],
    }

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/ai-games/weakness-profile')
            const data = await res.json()
            setProfile(data.profile)
        } catch { /* ignore */ }
    }, [])

    const fetchQuestion = useCallback(async () => {
        const t = topic || SUBJECT_TOPICS[subject]?.[0] || 'general'
        setLoading(true)
        setSelected(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic: t, gradeBand, difficulty: 3, questionType: 'mcq' }),
            })
            const data = await res.json()
            if (data.question) setQuestion(data.question)
        } catch { /* ignore */ }
        setLoading(false)
    }, [subject, topic, gradeBand])

    const handleSelect = (opt: string) => {
        if (selected || !question) return
        setSelected(opt)
        setTotal(t => t + 1)
        if (opt === question.correctAnswer) setScore(s => s + 1)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-emerald-400 text-sm font-medium">Weakness Trainer</span>
                    <div className="ml-auto text-right">
                        <div className="text-2xl font-black text-emerald-400">{score}/{total}</div>
                        <div className="text-slate-500 text-xs">Score</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl">&#127919;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Weakness Trainer</h1>
                        <p className="text-slate-400 text-sm">Targeted practice on your weakest skills</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <select value={subject} onChange={e => setSubject(e.target.value as typeof subject)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                        <option value="science">Science</option>
                        <option value="social-studies">Social Studies</option>
                        <option value="english">English</option>
                        <option value="gk">GK &amp; Life Skills</option>
                    </select>
                    <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                    <button onClick={fetchQuestion} disabled={loading}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50 transition-all">
                        {loading ? '...' : 'Practice'}
                    </button>
                </div>

                <div className="mb-6">
                    <select value={topic} onChange={e => setTopic(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                        <option value="">Auto (AI picks weakest topic)</option>
                        {(SUBJECT_TOPICS[subject] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {question && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-full">
                                {question.skillTag}
                            </span>
                        </div>
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map(opt => {
                                let cls = 'border-2 rounded-xl p-4 text-sm font-medium cursor-pointer transition-all '
                                if (!selected) cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-emerald-500 hover:bg-emerald-500/10'
                                else if (opt === question.correctAnswer) cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                else if (opt === selected) cls += 'border-red-500 bg-red-500/20 text-red-300'
                                else cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                return <button key={opt} className={cls} onClick={() => handleSelect(opt)}>{opt}</button>
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
                                <button onClick={fetchQuestion}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
                                    Next Question &#8594;
                                </button>
                            </>
                        )}
                    </div>
                )}

                {!question && !loading && (
                    <div className="text-center py-16 text-slate-500">
                        <div className="text-5xl mb-4">&#127919;</div>
                        <p>Click &quot;Practice&quot; to train on your weakest skills</p>
                        <button onClick={fetchProfile} className="mt-4 text-emerald-400 text-sm underline">
                            Load my weakness profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
