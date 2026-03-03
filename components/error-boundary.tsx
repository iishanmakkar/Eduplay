'use client'

/**
 * Global Error Boundary
 * Catches React render errors to prevent white-screen crashes.
 * Renders a styled fallback UI with a retry button.
 */
import React, { Component, ErrorInfo } from 'react'

interface Props {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Log to console — Sentry auto-captures from global-error.tsx but this
        // catches sub-tree errors that don't bubble to the root.
        console.error('[ErrorBoundary] Caught render error:', error, info.componentStack)
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
                    <div className="mb-6 text-5xl">⚠️</div>
                    <h2 className="mb-2 text-2xl font-bold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="mb-6 max-w-md text-sm text-muted-foreground">
                        An unexpected error occurred. This has been logged automatically.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRetry}
                            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            Try again
                        </button>
                        <button
                            onClick={() => (window.location.href = '/dashboard')}
                            className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
                        >
                            Go home
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-6 max-w-xl text-left">
                            <summary className="cursor-pointer text-xs font-mono text-destructive">
                                Error details (dev only)
                            </summary>
                            <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
                                {this.state.error.message}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
