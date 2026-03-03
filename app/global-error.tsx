'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // We strictly avoid logging full stack traces to Sentry or client APIs if it contains PII
        // The server-side error digest (Trace ID) allows SREs to correlate via Datadog/Vercel Logs
        console.error('Fatal application error bounded. Trace Digest ID:', error.digest)
    }, [error])

    return (
        <html lang="en">
            <body className="bg-slate-950 text-slate-50 min-h-screen flex items-center justify-center font-sans tracking-tight">
                <div className="max-w-md p-8 border border-red-900/50 bg-red-950/20 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-300 mb-4">
                        System Unavailable
                    </h2>

                    <p className="text-slate-400 mb-6 leading-relaxed">
                        EduPlay has encountered an unexpected structural fault. Our SRE team has been notified.
                        No internal structures or stack traces have been exposed.
                    </p>

                    <div className="bg-black/40 rounded-lg p-4 mb-8 font-mono text-sm text-slate-500 break-all text-left border border-white/5">
                        <span className="text-slate-600 block mb-1 uppercase text-xs font-bold tracking-widest">Trace ID</span>
                        {error.digest || 'Unknown-Trace-Id-Failed'}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
