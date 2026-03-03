'use client'

/**
 * components/games/AIGameErrorBoundary.tsx
 *
 * Universal error boundary for all /aipoweredgames pages.
 * Catches: API fetch failures, invalid JSON from AI, null question objects,
 * state-after-unmount, generation timeout explosions.
 *
 * Every AI game page should wrap its content with this component.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import Link from 'next/link'

interface Props {
    gameName?: string
    children: ReactNode
}
interface State { hasError: boolean; error: string }

export class AIGameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: '' }
    }
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error?.message ?? 'Unknown error' }
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[AIGameErrorBoundary] ${this.props.gameName ?? 'AI Game'} crashed:`, error, info.componentStack)
    }
    render() {
        if (!this.state.hasError) return this.props.children
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-black text-white mb-2">{this.props.gameName ?? 'AI Game'}</h2>
                    <p className="text-slate-400 text-sm mb-4">The AI service encountered an error. Please try again.</p>
                    <p className="text-slate-600 text-xs font-mono mb-6 bg-slate-900 rounded-xl p-3 text-left">
                        {this.state.error}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => this.setState({ hasError: false, error: '' })}
                            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all"
                        >
                            Retry
                        </button>
                        <Link
                            href="/aipoweredgames"
                            className="px-5 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-all"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
}

/**
 * Safe JSON question parser — never throws.
 * Returns null if AI response cannot be parsed into a usable question.
 */
export function safeParsAIQuestion(raw: unknown): {
    prompt: string
    answerOptions: string[]
    correctAnswer: string
    explanation: string
} | null {
    try {
        if (!raw || typeof raw !== 'object') return null
        const q = raw as Record<string, unknown>
        const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : null
        const correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : null
        const answerOptions = Array.isArray(q.answerOptions)
            ? (q.answerOptions as unknown[]).map(o => String(o)).filter(o => o.trim().length > 0)
            : null
        const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : 'No explanation provided.'

        if (!prompt || !correctAnswer || !answerOptions || answerOptions.length < 2) return null
        // Ensure correctAnswer is in the options (MCQ integrity check)
        if (!answerOptions.some(o => o.toLowerCase() === correctAnswer.toLowerCase())) {
            console.warn('[safeParsAIQuestion] correctAnswer not in options — injecting it')
            answerOptions[0] = correctAnswer // Replace first option to guarantee at least 1 correct
        }
        return { prompt, answerOptions, correctAnswer, explanation }
    } catch {
        return null
    }
}

/**
 * Clamp a numeric score to a valid range.
 * Use for essay/debate scores to prevent NaN or overflow.
 */
export function clampScore(value: unknown, min = 0, max = 100): number {
    const n = Number(value)
    if (!isFinite(n) || isNaN(n)) return 0
    return Math.round(Math.max(min, Math.min(max, n)))
}
