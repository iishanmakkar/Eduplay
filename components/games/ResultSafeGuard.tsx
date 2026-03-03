'use client'

/**
 * components/games/ResultSafeGuard.tsx
 *
 * PHASE 4 — Result Screen Crash Guard
 *
 * Wraps PostSessionDashboard (or any result UI) to guarantee it always renders
 * even if analytics data is missing, null, or undefined.
 *
 * Prevents:
 *  - finalScore undefined crash
 *  - masteryDelta null crash
 *  - hybridScore undefined crash
 *  - leaderboard blocking render
 *  - unhandled rejection crashing the screen
 *  - React state update after unmount on session complete
 */

import { type ErrorInfo, Component, type ReactNode } from 'react'
import Link from 'next/link'

// ── Minimal fallback summary (never crashes) ──────────────────────────────────

interface MinimalSummary {
    score?: number
    correctAnswers?: number
    totalQuestions?: number
    gameName?: string
    errorMessage?: string
}

function MinimalResultScreen({ summary, gameName }: { summary: MinimalSummary; gameName?: string }) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-sm w-full text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h1 className="text-2xl font-black text-white mb-2">Session Complete</h1>
                <p className="text-slate-400 text-sm mb-6">
                    {gameName ?? 'Game'} — {summary.gameName ?? 'Practice Session'}
                </p>
                {typeof summary.score === 'number' && (
                    <div className="text-3xl font-black text-violet-400 mb-4">{summary.score.toLocaleString()} pts</div>
                )}
                {typeof summary.correctAnswers === 'number' && typeof summary.totalQuestions === 'number' && (
                    <div className="text-slate-400 text-sm mb-6">
                        {summary.correctAnswers} / {summary.totalQuestions} correct
                        ({Math.round((summary.correctAnswers / Math.max(1, summary.totalQuestions)) * 100)}%)
                    </div>
                )}
                {summary.errorMessage && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4 text-amber-400 text-xs">
                        Analytics data incomplete: {summary.errorMessage}
                    </div>
                )}
                <Link
                    href="/games"
                    className="inline-block py-3 px-8 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
                >
                    Return to Games
                </Link>
            </div>
        </div>
    )
}

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface Props {
    children: ReactNode
    fallbackSummary?: MinimalSummary
    gameName?: string
}

interface State {
    hasError: boolean
    errorMessage: string
}

export class ResultSafeGuard extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, errorMessage: '' }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error?.message ?? 'Unknown error' }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ResultSafeGuard] Result screen crashed:', error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <MinimalResultScreen
                    summary={{ ...(this.props.fallbackSummary ?? {}), errorMessage: this.state.errorMessage }}
                    gameName={this.props.gameName}
                />
            )
        }
        return this.props.children
    }
}

// ── HOC wrapper ───────────────────────────────────────────────────────────────

/**
 * Wrap any result component to guarantee a graceful fallback on crash.
 */
export function withResultSafeGuard<T extends object>(
    WrappedComponent: React.ComponentType<T>,
    gameName?: string
) {
    return function SafeResultWrapper(props: T & { fallbackSummary?: MinimalSummary }) {
        const { fallbackSummary, ...componentProps } = props
        return (
            <ResultSafeGuard fallbackSummary={fallbackSummary} gameName={gameName}>
                <WrappedComponent {...(componentProps as T)} />
            </ResultSafeGuard>
        )
    }
}

/**
 * Safe score computation — never returns NaN or undefined.
 * Use in GameEngineCore.submit() to compute final score safely.
 */
export function safeScore(raw: number | null | undefined, fallback = 0): number {
    if (raw === null || raw === undefined || isNaN(raw) || !isFinite(raw)) return fallback
    return Math.round(Math.max(0, raw))
}

/**
 * Safe mastery delta — never undefined.
 */
export function safeMasteryDelta(current: number | null | undefined, previous: number | null | undefined): number {
    const cur = typeof current === 'number' && isFinite(current) ? current : 0
    const prev = typeof previous === 'number' && isFinite(previous) ? previous : 0
    return Math.round((cur - prev) * 100)  // Return as integer percentage points
}

/**
 * Safe hybrid score — never null.
 */
export function safeHybridScore(raw: number | null | undefined): number {
    if (raw === null || raw === undefined || isNaN(raw)) return 0
    return Math.max(0, Math.min(1, raw))
}
