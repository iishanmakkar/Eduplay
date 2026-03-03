'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

const LANGUAGES = [
    { value: 'english', label: 'English', topics: ['grammar', 'comprehension', 'vocabulary', 'idioms', 'tenses', 'punctuation'] },
    { value: 'hindi', label: 'Hindi', topics: ['vyakaran', 'shabdkosh', 'varnamala', 'muhavare', 'sandhi', 'samas'] },
]

export default function LanguageAIPage() {
    const [lang, setLang] = useState('english')
    const [topic, setTopic] = useState('grammar')
    const [gradeBand, setGradeBand] = useState('68')
    const [question, setQuestion] = useState<{ prompt: string; answerOptions: string[]; correctAnswer: string; explanation: string; skillTag: string } | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [score, setScore] = useState(0)
    const [total, setTotal] = useState(0)

    const currentLang = LANGUAGES.find(l => l.value === lang) ?? LANGUAGES[0]

    const fetchQuestion = useCallback(async () => {
        setLoading(true)
        setSelected(null)
        try {
            const res = await fetch('/api/ai-games/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: lang, topic, gradeBand, difficulty: 3, questionType: 'mcq' }),
            })
            const data = await res.json()
            if (data.question) setQuestion(data.question)
        } catch { /* ignore */ }
        setLoading(false)
    }, [lang, topic, gradeBand])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <div className="ml-auto text-right">
                        <div className="text-2xl font-black text-indigo-400">{score}/{total}</div>
                        <div className="text-slate-500 text-xs">Score</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-2xl">&#128483;&#65039;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Language Fluency Engine</h1>
                        <p className="text-slate-400 text-sm">Master English and Hindi with AI-generated exercises</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="flex gap-1 border border-slate-700 rounded-xl p-1">
                        {LANGUAGES.map(l => (
                            <button key={l.value} onClick={() => { setLang(l.value); setTopic(l.topics[0]); setQuestion(null) }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${lang === l.value ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                                {l.label}
                            </button>
                        ))}
                    </div>
                    <select value={topic} onChange={e => setTopic(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                        {currentLang.topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                        <option value="35">Grade 3-5</option>
                        <option value="68">Grade 6-8</option>
                        <option value="912">Grade 9-12</option>
                    </select>
                </div>

                <button onClick={fetchQuestion} disabled={loading}
                    className="w-full mb-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-50">
                    {loading ? 'Generating...' : 'Generate Question'}
                </button>

                {question && (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 space-y-4">
                        <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-full">{question.skillTag}</span>
                        <p className="text-white text-lg font-semibold leading-relaxed">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.answerOptions.map(opt => {
                                let cls = 'border-2 rounded-xl p-4 text-sm font-medium cursor-pointer transition-all '
                                if (!selected) cls += 'border-slate-600 bg-slate-800/60 text-white hover:border-indigo-500 hover:bg-indigo-500/10'
                                else if (opt === question.correctAnswer) cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                else if (opt === selected) cls += 'border-red-500 bg-red-500/20 text-red-300'
                                else cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500'
                                return (
                                    <button key={opt} className={cls} onClick={() => {
                                        if (selected) return; setSelected(opt); setTotal(t => t + 1)
                                        if (opt === question.correctAnswer) setScore(s => s + 1)
                                    }}>{opt}</button>
                                )
                            })}
                        </div>
                        {selected && (
                            <>
                                <div className="rounded-xl bg-slate-800/60 p-4">
                                    <p className="text-sm text-slate-300">
                                        <span className="text-indigo-400 font-bold">Explanation: </span>
                                        {question.explanation}
                                    </p>
                                </div>
                                <button onClick={fetchQuestion}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">
                                    Next &#8594;
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
