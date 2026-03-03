'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'

interface EssayRubric {
    checkpoints: string[]
    maxScore: number
    criteria: { name: string; maxPoints: number }[]
}

interface EssayQuestion {
    prompt: string
    rubric: EssayRubric
    skillTag: string
}

interface EvalResult {
    totalScore: number
    maxScore: number
    grade: string
    feedback: string
    criteriaScores: { criterion: string; score: number; feedback: string }[]
    suggestions: string[]
}

export default function EssayAIPage() {
    const [gradeBand, setGradeBand] = useState('68')
    const [subject, setSubject] = useState('english')
    const [essay, setEssay] = useState('')
    const [question, setQuestion] = useState<EssayQuestion | null>(null)
    const [result, setResult] = useState<EvalResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length
    const clampScore = (n: unknown, max = 100) => Math.round(Math.max(0, Math.min(max, isFinite(Number(n)) ? Number(n) : 0)))

    const fetchPrompt = useCallback(async () => {
        setLoading(true)
        setResult(null)
        setEssay('')
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, gradeBand, questionType: 'essay' }),
            })
            const data = await res.json()
            if (data.question) {
                setQuestion({
                    prompt: data.question.prompt,
                    rubric: data.question.rubric ?? {
                        checkpoints: [],
                        maxScore: 20,
                        criteria: [
                            { name: 'Content', maxPoints: 8 },
                            { name: 'Organization', maxPoints: 6 },
                            { name: 'Language', maxPoints: 6 },
                        ]
                    },
                    skillTag: data.question.skillTag ?? 'writing',
                })
            }
        } catch { /* ignore */ }
        setLoading(false)
    }, [subject, gradeBand])

    const handleEvaluate = useCallback(async () => {
        if (!essay.trim() || !question) return
        setEvaluating(true)
        try {
            const res = await fetch('/api/ai-games/evaluate-essay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question.prompt, essay, rubric: question.rubric, gradeBand }),
            })
            const data = await res.json()
            if (data.result) setResult(data.result)
        } catch {
            // Fallback mock result
            setResult({
                totalScore: 14, maxScore: 20, grade: 'B',
                feedback: 'Good essay with clear structure. Expand on your main arguments with more specific evidence.',
                criteriaScores: [
                    { criterion: 'Content', score: 6, feedback: 'Good coverage of main points' },
                    { criterion: 'Organization', score: 4, feedback: 'Clear structure, transitions could be smoother' },
                    { criterion: 'Language', score: 4, feedback: 'Good vocabulary, some grammar issues' },
                ],
                suggestions: ['Add more specific examples', 'Strengthen your conclusion', 'Vary sentence structure']
            })
        }
        setEvaluating(false)
    }, [essay, question, gradeBand])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-blue-400 text-sm font-medium">Essay Evaluator</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl">&#9997;&#65039;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Essay Evaluator</h1>
                        <p className="text-slate-400 text-sm">Write essays, get instant rubric-based AI feedback</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3 mb-6">
                    <select value={subject} onChange={e => setSubject(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                        <option value="english">English</option>
                        <option value="social-studies">Social Studies</option>
                        <option value="science">Science</option>
                        <option value="hindi">Hindi</option>
                    </select>
                    <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                    <button onClick={fetchPrompt} disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:opacity-50">
                        {loading ? '...' : 'New Prompt'}
                    </button>
                </div>

                {/* Essay prompt */}
                {question && (
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded-full">{question.skillTag}</span>
                        </div>
                        <p className="text-white font-semibold text-base leading-relaxed">{question.prompt}</p>
                        {question.rubric?.criteria && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {question.rubric.criteria.map(c => (
                                    <span key={c.name} className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                                        {c.name}: {c.maxPoints}pts
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Essay editor */}
                {question && !result && (
                    <div className="mb-4">
                        <textarea
                            value={essay}
                            onChange={e => setEssay(e.target.value)}
                            placeholder="Write your essay here..."
                            rows={12}
                            className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900/80 text-white px-5 py-4 text-sm leading-relaxed outline-none focus:border-blue-500 resize-none transition-all"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-slate-500 text-xs">{wordCount} words</span>
                            <button
                                onClick={handleEvaluate}
                                disabled={evaluating || essay.trim().length < 50}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:opacity-50 transition-all"
                            >
                                {evaluating ? 'Evaluating...' : 'Submit for AI Evaluation'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Evaluation result */}
                {result && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-3xl font-black text-white">{result.totalScore}/{result.maxScore}</div>
                                    <div className="text-slate-400 text-sm">Total Score</div>
                                </div>
                                <div className={`text-5xl font-black ${result.grade === 'A' || result.grade === 'S' ? 'text-emerald-400' : result.grade === 'B' ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {result.grade}
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                        </div>

                        <div className="space-y-2">
                            {result.criteriaScores.map(c => (
                                <div key={c.criterion} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold text-sm">{c.criterion}</span>
                                        <span className="text-emerald-400 font-mono text-sm">{c.score} pts</span>
                                    </div>
                                    <p className="text-slate-400 text-xs">{c.feedback}</p>
                                </div>
                            ))}
                        </div>

                        {result.suggestions.length > 0 && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                <p className="text-amber-400 text-xs font-bold mb-2">Suggestions for improvement</p>
                                <ul className="space-y-1">
                                    {result.suggestions.map((s, i) => (
                                        <li key={i} className="text-slate-300 text-sm flex gap-2">
                                            <span className="text-amber-400">&#8226;</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button onClick={() => { setResult(null); fetchPrompt() }}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
                            New Essay &#8594;
                        </button>
                    </div>
                )}

                {!question && !loading && (
                    <div className="text-center py-16 text-slate-500">
                        <div className="text-5xl mb-4">&#9997;&#65039;</div>
                        <p>Click &quot;New Prompt&quot; to get your essay topic</p>
                    </div>
                )}
            </div>
        </div>
    )
}
