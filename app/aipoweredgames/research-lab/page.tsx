'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface ResearchTurn {
    role: 'user' | 'ai'
    text: string
}

const RESEARCH_TOPICS = [
    'How does the human immune system work?',
    'What caused the fall of the Roman Empire?',
    'How does machine learning work?',
    'Why do we dream?',
    'What is quantum entanglement?',
    'How did the internet change society?',
]

export default function ResearchLabPage() {
    const [topic, setTopic] = useState(RESEARCH_TOPICS[0])
    const [conversation, setConversation] = useState<ResearchTurn[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [started, setStarted] = useState(false)

    const startSession = useCallback(async () => {
        setStarted(true)
        setLoading(true)
        setConversation([])
        try {
            const res = await fetch('/api/ai-games/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, action: 'start' }),
            })
            const data = await res.json()
            setConversation([{ role: 'ai', text: data.message ?? `Let's explore: "${topic}". What do you already know about this topic?` }])
        } catch {
            setConversation([{ role: 'ai', text: `Let's explore: "${topic}". What do you already know about this topic? Tell me your current understanding and I'll guide you deeper.` }])
        }
        setLoading(false)
    }, [topic])

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading) return
        const userMsg: ResearchTurn = { role: 'user', text: input }
        setConversation(c => [...c, userMsg])
        const currentInput = input
        setInput('')
        setLoading(true)
        try {
            const res = await fetch('/api/ai-games/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, action: 'message', message: currentInput, history: [...conversation, userMsg] }),
            })
            const data = await res.json()
            setConversation(c => [...c, { role: 'ai', text: data.message }])
        } catch {
            setConversation(c => [...c, { role: 'ai', text: 'Interesting point! Can you elaborate further? What connections can you draw to what you already know?' }])
        }
        setLoading(false)
    }, [input, loading, topic, conversation])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-400 text-sm">Research Lab</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center text-2xl">&#128300;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Research Lab</h1>
                        <p className="text-slate-400 text-sm">Socratic learning — AI asks better questions than answers</p>
                    </div>
                </div>

                {!started ? (
                    <div className="space-y-4">
                        <label className="text-slate-400 text-sm font-medium block">Choose a research topic</label>
                        <div className="grid grid-cols-1 gap-2">
                            {RESEARCH_TOPICS.map(t => (
                                <button key={t} onClick={() => setTopic(t)}
                                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${topic === t
                                        ? 'border-violet-500 bg-violet-500/10 text-white'
                                        : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button onClick={startSession}
                            className="w-full py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm">
                            Begin Socratic Session &#8594;
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
                            {conversation.map((turn, i) => (
                                <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${turn.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-sm'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'}`}>
                                        {turn.role === 'ai' && <div className="text-xs text-slate-400 mb-1 font-medium">&#128300; Socratic Guide</div>}
                                        {turn.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Share your thoughts..."
                                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-white px-4 py-3 text-sm outline-none focus:border-violet-500"
                            />
                            <button onClick={sendMessage} disabled={loading || !input.trim()}
                                className="px-5 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm disabled:opacity-50">
                                &#8594;
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
