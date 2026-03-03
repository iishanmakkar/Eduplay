'use client'

import type { ReactNode } from 'react'
import { AIGameErrorBoundary } from '@/components/games/AIGameErrorBoundary'

export default function AIGamesLayout({ children }: { children: ReactNode }) {
    return (
        <AIGameErrorBoundary gameName="AI Games">
            <div className="ai-games-shell">
                {/* Separate shell from main /games layout — no game header/sidebar */}
                {children}
            </div>
        </AIGameErrorBoundary>
    )
}

