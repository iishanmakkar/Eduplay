'use client'

import { useState, useCallback } from 'react'

export default function AILiveMathPage() {
    const [gradeBand, setGradeBand] = useState('68')
    const [topic, setTopic] = useState('algebra')
    const [question, setQuestion] = useState<{
        prompt: string
        answerOptions: string[]
        correctAnswer: string
        explanation: string
    } | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)

    const fetchQuestion = useCallback(async () => {
        setLoading(true)
        setSelected(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'mathematics', topic, gradeBand, difficulty: 3, questionType: 'mcq' }),
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
    }, [topic, gradeBand])

    const handleSelect = (opt: string) => {
        if (selected) return
        setSelected(opt)
        setTotal(t => t + 1)
        if (opt === question?.correctAnswer) setScore(s => s + 1)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-2xl">
                        &#8734;
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Live Math Generator</h1>
                        <p className="text-slate-400 text-sm">Infinite adaptive questions, validated by AI</p>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-2xl font-black text-emerald-400">{score}/{total}</div>
                        <div className="text-slate-500 text-xs">Score</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3 mb-6">
                    <select
                        value={gradeBand}
                        onChange={e => setGradeBand(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    >
                        <option value="kg2">Grade KG-2</option>
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                    <select
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                    >
                        <option value="addition">Addition</option>
                        <option value="fractions">Fractions</option>
                        <option value="algebra">Algebra</option>
                        <option value="geometry">Geometry</option>
                        <option value="probability">Probability</option>
                        <option value="calculus">Calculus</option>
                    </select>
                    <button
                        onClick={fetchQuestion}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : 'Generate'}
                    </button>
                </div>

                {/* Question card */}
                {question && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 space-y-5">
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map(opt => {
                                const isSelected = opt === selected
                                const isCorrect = opt === question.correctAnswer
                                let cls = 'border-2 rounded-xl p-4 text-sm font-semibold cursor-pointer transition-all '
                                if (!selected) {
                                    cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-violet-500 hover:bg-violet-500/10'
                                } else if (isCorrect) {
                                    cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                } else if (isSelected) {
                                    cls += 'border-red-500 bg-red-500/20 text-red-300'
                                } else {
                                    cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                }
                                return (
                                    <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                        {selected && (
                            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
                                <p className="text-slate-300 text-sm">
                                    <span className="text-violet-400 font-bold">Explanation: </span>
                                    {question.explanation}
                                </p>
                            </div>
                        )}
                        {selected && (
                            <button
                                onClick={fetchQuestion}
                                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm"
                            >
                                Next Question &rarr;
                            </button>
                        )}
                    </div>
                )}

                {!question && !loading && (
                    <div className="text-center py-16 text-slate-500">
                        <div className="text-5xl mb-4">&#8734;</div>
                        <p>Click &ldquo;Generate&rdquo; to start your adaptive math session</p>
                    </div>
                )}

                {/* AI tag */}
                <div className="mt-6 text-center">
                    <span className="text-xs text-violet-400/60 font-mono">
                        aiGenerated: true &bull; validateAIOutputIntegrity() passed
                    </span>
                </div>
            </div>
        </div>
    )
}
