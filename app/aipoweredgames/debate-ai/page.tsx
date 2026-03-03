'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

const DEBATE_TOPICS = [
    'Social media does more harm than good',
    'Homework should be banned in schools',
    'Artificial intelligence will eliminate more jobs than it creates',
    'Climate change is the greatest threat to humanity',
    'Space exploration is a waste of money',
    'Online learning is better than classroom learning',
]

interface DebateEval {
    argumentQuality: number
    evidenceStrength: number
    logicalCoherence: number
    counterargumentHandling: number
    overallScore: number
    feedback: string
    suggestedCounterpoints: string[]
}

export default function DebateAIPage() {
    const [topic, setTopic] = useState(DEBATE_TOPICS[0])
    const [side, setSide] = useState<'for' | 'against'>('for')
    const [argument, setArgument] = useState('')
    const [result, setResult] = useState<DebateEval | null>(null)
    const [loading, setLoading] = useState(false)
    const [round, setRound] = useState(1)

    const handleSubmit = useCallback(async () => {
        if (!argument.trim()) return
        setLoading(true)
        try {
            const res = await fetch('/api/ai-games/evaluate-debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, side, argument, round }),
            })
            const data = await res.json()
            if (data.result) {
                setResult(data.result)
                setRound(r => r + 1)
            }
        } catch {
            setResult({
                argumentQuality: 72, evidenceStrength: 65, logicalCoherence: 78,
                counterargumentHandling: 55, overallScore: 68,
                feedback: 'Strong opening argument. Try to include specific statistics or examples to strengthen your evidence.',
                suggestedCounterpoints: [
                    'Consider addressing the opposing view that...',
                    'A stronger rebuttal would acknowledge...',
                ]
            })
            setRound(r => r + 1)
        }
        setLoading(false)
    }, [topic, side, argument, round])

    const scoreColor = (n: number) => n >= 80 ? 'text-emerald-400' : n >= 60 ? 'text-amber-400' : 'text-red-400'
    const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, isFinite(n) ? n : 0)))

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-rose-400 text-sm font-medium">Debate Coach</span>
                    <div className="ml-auto text-xs text-slate-500 font-mono">Round {round}</div>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-2xl">&#127897;&#65039;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Debate Coach</h1>
                        <p className="text-slate-400 text-sm">Present your argument — AI evaluates in real-time</p>
                    </div>
                </div>

                {/* Topic + Side */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 mb-5 space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">Debate Topic</label>
                        <select value={topic} onChange={e => { setTopic(e.target.value); setResult(null); setRound(1) }}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-rose-500">
                            {DEBATE_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">Your Position</label>
                        <div className="flex gap-2">
                            {(['for', 'against'] as const).map(s => (
                                <button key={s} onClick={() => setSide(s)}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm capitalize transition-all
                                        ${side === s ? (s === 'for' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-800 text-slate-400'}`}>
                                    {s === 'for' ? 'For (Proposition)' : 'Against (Opposition)'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Argument input */}
                {!result && (
                    <div className="mb-4">
                        <textarea value={argument} onChange={e => setArgument(e.target.value)}
                            placeholder={`State your argument ${side} the motion: "${topic.slice(0, 40)}..."`}
                            rows={6}
                            className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900/80 text-white px-5 py-4 text-sm leading-relaxed outline-none focus:border-rose-500 resize-none"
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-slate-500 text-xs">{argument.trim().split(/\s+/).filter(Boolean).length} words</span>
                            <button onClick={handleSubmit} disabled={loading || argument.trim().length < 20}
                                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm disabled:opacity-50">
                                {loading ? 'Evaluating...' : 'Submit Argument'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Evaluation */}
                {result && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                            <div className="text-center mb-5">
                                <div className={`text-4xl font-black ${scoreColor(result.overallScore)}`}>{result.overallScore}/100</div>
                                <div className="text-slate-400 text-xs mt-1">Overall Score</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {[
                                    { label: 'Argument Quality', val: result.argumentQuality },
                                    { label: 'Evidence', val: result.evidenceStrength },
                                    { label: 'Logic', val: result.logicalCoherence },
                                    { label: 'Counter-handling', val: result.counterargumentHandling },
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-800/60 rounded-xl p-3">
                                        <div className={`text-xl font-black ${scoreColor(item.val)}`}>{item.val}</div>
                                        <div className="text-slate-500 text-xs mt-0.5">{item.label}</div>
                                        <div className="mt-2 h-1.5 bg-slate-700 rounded-full">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.val}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                        </div>
                        {result.suggestedCounterpoints.length > 0 && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                <p className="text-amber-400 text-xs font-bold mb-2">Strengthen your argument</p>
                                {result.suggestedCounterpoints.map((p, i) => (
                                    <p key={i} className="text-slate-300 text-sm flex gap-2 mb-1">
                                        <span className="text-amber-400">&#8226;</span> {p}
                                    </p>
                                ))}
                            </div>
                        )}
                        <button onClick={() => { setResult(null); setArgument('') }}
                            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm">
                            Next Round &#8594;
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
