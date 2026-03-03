'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
    gameKey?: string
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * GameErrorBoundary — wraps each game to catch React rendering errors.
 * Shows a friendly "Game crashed" message with a retry button.
 * Prevents the entire app from crashing when one game has a bug.
 */
export class GameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[GameErrorBoundary] Game "${this.props.gameKey}" crashed:`, error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-6">
                    <div className="text-6xl">⚠️</div>
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2">Game Error</h2>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Something went wrong in {this.props.gameKey ?? 'this game'}.
                            Your progress has been saved.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-3 text-left text-xs text-red-400 bg-red-900/20 rounded p-3 max-w-md overflow-auto">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                    >
                        🔄 Try Again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
