'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log silently to APM. Exclude stack from output.
        console.error(`Route Error Boundary Caught Exception:`, error.digest)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-rose-500 mb-4 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Segment Temporarily Unavailable</h3>
            <p className="text-slate-400 max-w-sm mb-6">
                This specific component encountered a rendering fault. The system has automatically isolated the error.
                <br /><br />
                <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-500">
                    Trace: {error.digest || 'Internal-Component-Fault'}
                </span>
            </p>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
            >
                Reload Component
            </button>
        </div>
    )
}
