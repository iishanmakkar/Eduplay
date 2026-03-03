'use client'

import { useState } from 'react'

const GAME_KEYS = [
    'NUMBER_CATERPILLAR', 'FRACTION_ARROW_ARCHER', 'ALGEBRA_WAVE_SURFER', 'QUADRATIC_QUEST',
    'PERIODIC_BATTLESHIP', 'ANIMAL_KINGDOM_SORTER', 'CAPITALS_CONQUEST', 'BINARY_BLASTER',
    'SYNONYM_SWITCHBLADE', 'GRAMMAR_GLADIATOR', 'SHABDKOSH_SPRINT', 'BUDGET_BATTLE',
]

interface GeneratedQuestion {
    id: string
    prompt: string
    answerOptions?: string[]
    correctAnswer?: string
    difficultyLevel: number
    gradeBand: string
    status: 'generated' | 'validated' | 'rejected'
    validationScore: number
}

export default function GeneratePage() {
    const [gameKey, setGameKey] = useState('NUMBER_CATERPILLAR')
    const [gradeBand, setGradeBand] = useState('68')
    const [difficulty, setDifficulty] = useState(3)
    const [count, setCount] = useState(20)
    const [generating, setGenerating] = useState(false)
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        setGenerating(true)
        setProgress(0)
        setError(null)
        setQuestions([])

        try {
            // Generate in batches of 10
            const batches = Math.ceil(count / 10)
            const allQuestions: GeneratedQuestion[] = []

            for (let b = 0; b < batches; b++) {
                const batchCount = Math.min(10, count - b * 10)
                const res = await fetch('/api/admin/content-lab/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameKey, gradeBand, difficulty, count: batchCount }),
                })
                if (!res.ok) throw new Error(`Batch ${b + 1} failed: ${res.statusText}`)
                const data = await res.json()
                allQuestions.push(...(data.questions ?? []))
                setProgress(Math.round(((b + 1) / batches) * 100))
            }

            setQuestions(allQuestions)
        } catch (e) {
            setError(String(e))
        } finally {
            setGenerating(false)
        }
    }

    const handleSendToReview = async () => {
        const validated = questions.filter(q => q.status === 'validated')
        if (validated.length === 0) return
        await fetch('/api/admin/content-lab/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: validated }),
        })
        alert(`${validated.length} questions sent to review queue.`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-black text-white mb-6">Bulk Generate Questions</h1>

                {/* Controls */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div>
                            <label className="text-slate-400 text-xs font-medium block mb-1.5">Game</label>
                            <select
                                value={gameKey}
                                onChange={e => setGameKey(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                            >
                                {GAME_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium block mb-1.5">Grade Band</label>
                            <select
                                value={gradeBand}
                                onChange={e => setGradeBand(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                            >
                                <option value="kg2">KG-2</option>
                                <option value="35">3-5</option>
                                <option value="68">6-8</option>
                                <option value="912">9-12</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium block mb-1.5">Difficulty (1-5)</label>
                            <input
                                type="number" min={1} max={5} value={difficulty}
                                onChange={e => setDifficulty(parseInt(e.target.value))}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                            />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium block mb-1.5">Count (max 500)</label>
                            <input
                                type="number" min={1} max={500} value={count}
                                onChange={e => setCount(Math.min(500, parseInt(e.target.value)))}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm disabled:opacity-50 transition-all"
                        >
                            {generating ? `Generating... ${progress}%` : 'Generate Questions'}
                        </button>
                        {questions.length > 0 && (
                            <button
                                onClick={handleSendToReview}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
                            >
                                Send {questions.filter(q => q.status === 'validated').length} to Review
                            </button>
                        )}
                        {questions.length > 0 && (
                            <span className="text-slate-400 text-sm">
                                {questions.filter(q => q.status === 'validated').length} / {questions.length} validated
                            </span>
                        )}
                    </div>

                    {generating && (
                        <div className="mt-4">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Question list */}
                {questions.length > 0 && (
                    <div className="space-y-3">
                        {questions.map((q, i) => (
                            <div
                                key={q.id}
                                className={`rounded-xl border p-4 ${q.status === 'validated'
                                    ? 'border-emerald-700/50 bg-emerald-950/30'
                                    : q.status === 'rejected'
                                        ? 'border-red-700/50 bg-red-950/30'
                                        : 'border-slate-700/50 bg-slate-900/60'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-slate-500 text-xs font-mono">#{i + 1}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.status === 'validated' ? 'bg-emerald-500/20 text-emerald-400'
                                                    : q.status === 'rejected' ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {q.status} &bull; score: {q.validationScore}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm font-medium">{q.prompt}</p>
                                        {q.correctAnswer && (
                                            <p className="text-emerald-400 text-xs mt-1">
                                                Correct: {q.correctAnswer}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
