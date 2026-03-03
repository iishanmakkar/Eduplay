'use client'

/**
 * Split-Screen Layout
 * Side-by-side competitive gameplay container
 */

import { ReactNode } from 'react'
import { PlayerSide } from '@/lib/multiplayer/game-modes'
import CompetitionBar from './CompetitionBar'
import { theme } from '@/lib/theme'

interface SplitScreenLayoutProps {
    // Player info
    playerOneName: string
    playerTwoName: string
    playerOneColor: string
    playerTwoColor: string
    playerOneAvatar: string
    playerTwoAvatar: string

    // Scores
    playerOneScore: number
    playerTwoScore: number

    // Game content
    playerOneContent: ReactNode
    playerTwoContent: ReactNode

    // Competition state
    showCompetitionBar?: boolean
    showOvertake?: boolean

    // Layout options
    smartboardMode?: boolean
    fullscreen?: boolean
}

export default function SplitScreenLayout({
    playerOneName,
    playerTwoName,
    playerOneColor,
    playerTwoColor,
    playerOneAvatar,
    playerTwoAvatar,
    playerOneScore,
    playerTwoScore,
    playerOneContent,
    playerTwoContent,
    showCompetitionBar = true,
    showOvertake = false,
    smartboardMode = false,
    fullscreen = false
}: SplitScreenLayoutProps) {
    return (
        <div className={`${theme.page} transition-colors duration-300 ${smartboardMode ? 'smartboard-mode' : ''} ${fullscreen ? 'fullscreen' : ''}`}>
            {/* Competition Bar (Top) */}
            {showCompetitionBar && (
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                    <CompetitionBar
                        playerOneScore={playerOneScore}
                        playerTwoScore={playerTwoScore}
                        playerOneName={playerOneName}
                        playerTwoName={playerTwoName}
                        playerOneColor={playerOneColor}
                        playerTwoColor={playerTwoColor}
                        showOvertake={showOvertake}
                    />
                </div>
            )}

            {/* Split Screen Game Area */}
            <div className="grid grid-cols-[45%_10%_45%] h-[calc(100vh-200px)] touch-none select-none">
                {/* Player 1 Side (Left) */}
                <div
                    className="border-r-4 p-6 overflow-y-auto touch-pan-y relative"
                    style={{ borderColor: playerOneColor, touchAction: 'pan-y' }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Player Header */}
                    <div className="mb-6 text-center pointer-events-none">
                        <div className="text-6xl mb-2">{playerOneAvatar}</div>
                        <h2 className="text-3xl font-black" style={{ color: playerOneColor }}>
                            {playerOneName}
                        </h2>
                        <div className="text-5xl font-black mt-2" style={{ color: playerOneColor }}>
                            {playerOneScore}
                        </div>
                    </div>

                    {/* Player 1 Game Content */}
                    <div className="player-side-active relative z-10">
                        {playerOneContent}
                    </div>
                </div>

                {/* Center Divider */}
                <div className="bg-slate-200 dark:bg-slate-800 flex items-center justify-center pointer-events-none select-none transition-colors border-x border-slate-300 dark:border-slate-700">
                    <div className="text-6xl font-black text-slate-400 dark:text-slate-600 transform rotate-90">
                        VS
                    </div>
                </div>

                {/* Player 2 Side (Right) */}
                <div
                    className="border-l-4 p-6 overflow-y-auto touch-pan-y relative"
                    style={{ borderColor: playerTwoColor, touchAction: 'pan-y' }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Player Header */}
                    <div className="mb-6 text-center pointer-events-none">
                        <div className="text-6xl mb-2">{playerTwoAvatar}</div>
                        <h2 className="text-3xl font-black" style={{ color: playerTwoColor }}>
                            {playerTwoName}
                        </h2>
                        <div className="text-5xl font-black mt-2" style={{ color: playerTwoColor }}>
                            {playerTwoScore}
                        </div>
                    </div>

                    {/* Player 2 Game Content */}
                    <div className="player-side-active relative z-10">
                        {playerTwoContent}
                    </div>
                </div>
            </div>
        </div>
    )
}
