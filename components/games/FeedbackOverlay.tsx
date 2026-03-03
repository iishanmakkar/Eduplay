'use client'

import { useEffect, useState } from 'react'
import type { GradeTier } from '@/lib/microcopy/tone-system'
import { getCorrectMessage, getIncorrectMessage, getXPMessage, getStreakMessage } from '@/lib/microcopy/tone-system'

interface FeedbackOverlayProps {
    visible: boolean
    correct: boolean
    xpEarned?: number
    streakCount?: number
    skillTag?: string
    explanation?: string
    correctAnswer?: string
    questionIndex?: number
    gradeTier?: GradeTier
    onDismiss?: () => void
    autoHideMs?: number  // Auto-dismiss after N ms (0 = manual only)
}

export default function FeedbackOverlay({
    visible,
    correct,
    xpEarned = 0,
    streakCount = 0,
    skillTag = 'this skill',
    explanation,
    correctAnswer,
    questionIndex = 0,
    gradeTier = '68',
    onDismiss,
    autoHideMs = 2500,
}: FeedbackOverlayProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (visible) {
            setShow(true)
            if (autoHideMs > 0 && !explanation) {
                const t = setTimeout(() => { setShow(false); onDismiss?.() }, autoHideMs)
                return () => clearTimeout(t)
            }
        } else {
            setShow(false)
        }
    }, [visible, autoHideMs, explanation, onDismiss])

    if (!show) return null

    const msg = correct
        ? getCorrectMessage(gradeTier, questionIndex)
        : getIncorrectMessage(gradeTier, questionIndex)

    const showStreak = correct && streakCount >= 2
    const showXP = correct && xpEarned > 0

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${correct
                        ? 'border-emerald-500/40 bg-slate-900'
                        : 'border-red-500/30 bg-slate-900'
                    }`}
                style={{
                    animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Icon */}
                <div className="text-4xl text-center mb-3">
                    {correct
                        ? streakCount >= 5 ? '🔥' : streakCount >= 3 ? '⚡' : '✅'
                        : '🔍'}
                </div>

                {/* Headline */}
                <h2 className={`text-xl font-black text-center mb-1 ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {msg.headline}
                </h2>
                <p className="text-slate-300 text-sm text-center leading-relaxed mb-4">
                    {msg.subtext}
                </p>

                {/* Streak banner */}
                {showStreak && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-center mb-3">
                        <span className="text-amber-400 text-sm font-bold">
                            {getStreakMessage(gradeTier, streakCount)}
                        </span>
                    </div>
                )}

                {/* XP pill */}
                {showXP && (
                    <div className="rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-center mb-3">
                        <span className="text-violet-400 text-xs font-medium">
                            {getXPMessage(gradeTier, xpEarned, skillTag)}
                        </span>
                    </div>
                )}

                {/* Correct answer reveal (for wrong) */}
                {!correct && correctAnswer && (
                    <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 mb-3">
                        <p className="text-xs text-slate-500 mb-1">Correct answer</p>
                        <p className="text-white font-bold text-sm">{correctAnswer}</p>
                    </div>
                )}

                {/* Explanation */}
                {explanation && (
                    <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 mb-4">
                        <p className="text-xs text-slate-500 mb-1">Explanation</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
                    </div>
                )}

                {/* Dismiss CTA */}
                <button
                    onClick={() => { setShow(false); onDismiss?.() }}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${correct
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                >
                    {msg.cta ?? 'Continue'}
                </button>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
