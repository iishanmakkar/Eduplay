'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Game Error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-6xl mb-6">🤕</div>
                <h2 className="text-2xl font-bold text-ink mb-4">Something went wrong!</h2>
                <p className="text-mist mb-8">
                    We encountered an unexpected error while loading the game.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-emerald text-white font-semibold rounded-xl hover:bg-emerald-dark transition"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/games"
                        className="px-6 py-3 bg-gray-100 text-ink font-semibold rounded-xl hover:bg-gray-200 transition"
                    >
                        Back to Games
                    </Link>
                </div>
            </div>
        </div>
    )
}
