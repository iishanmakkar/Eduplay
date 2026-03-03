'use client'

/**
 * Victory Screen
 * End-of-match celebration and stats
 */

import { useEffect, useState } from 'react'
import { PlayerSide } from '@/lib/multiplayer/game-modes'
import { soundManager } from '@/lib/multiplayer/sounds'
import { theme } from '@/lib/theme'

interface VictoryScreenProps {
    winner: PlayerSide | 'tie'
    playerOneName: string
    playerTwoName: string
    playerOneAvatar?: string
    playerTwoAvatar?: string
    playerOneScore: number
    playerTwoScore: number
    playerOneAccuracy: number
    playerTwoAccuracy: number
    playerOneAvgSpeed?: number
    playerTwoAvgSpeed?: number
    onPlayAgain: () => void
    onSwitchSides: () => void
    onNewPlayers: () => void
    onBackToMenu: () => void
    xpEarned?: number
}

export default function VictoryScreen({
    winner,
    playerOneName,
    playerTwoName,
    playerOneAvatar = '👤',
    playerTwoAvatar = '👤',
    playerOneScore,
    playerTwoScore,
    playerOneAccuracy,
    playerTwoAccuracy,
    playerOneAvgSpeed,
    playerTwoAvgSpeed,
    onPlayAgain,
    onSwitchSides,
    onNewPlayers,
    onBackToMenu,
    xpEarned = 0
}: VictoryScreenProps) {
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        // Play victory sound
        if (winner === 'tie') {
            soundManager.playTie()
        } else {
            soundManager.playVictory()
        }

        // Stats are now recorded via API in PlayGamePage.
        // We no longer use local storage here.

        // Show confetti
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
    }, [winner])

    const getWinnerName = () => {
        if (winner === 'tie') return 'TIE GAME'
        return winner === PlayerSide.LEFT ? playerOneName : playerTwoName
    }

    const getWinnerEmoji = () => {
        if (winner === 'tie') return '🤝'
        return winner === PlayerSide.LEFT ? playerOneAvatar : playerTwoAvatar
    }

    return (
        <div className={theme.page + " flex items-center justify-center p-8 relative overflow-hidden"}>
            {/* Confetti */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-0 h-full w-1 bg-white dark:bg-mist transform -translate-x-1/2 z-10" />
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece absolute"
                            style={{
                                left: `${Math.random() * 100}%`,
                                width: '10px',
                                height: '10px',
                                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="max-w-4xl w-full">
                {/* Winner Announcement */}
                <div className="text-center mb-12">
                    <div className="trophy-spin text-9xl mb-6">
                        {getWinnerEmoji()}
                    </div>
                    <h1 className="victory-bounce text-8xl font-black mb-4" style={{
                        background: winner === 'tie'
                            ? 'linear-gradient(45deg, #3B82F6, #EF4444)'
                            : winner === PlayerSide.LEFT
                                ? 'linear-gradient(45deg, #EF4444, #F59E0B)'
                                : 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {getWinnerName()}
                    </h1>
                    {winner !== 'tie' && (
                        <p className={`text-4xl font-bold ${theme.textSecondary}`}>WINS!</p>
                    )}
                    {xpEarned > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-yellow-400 text-gray-900 rounded-full font-black text-xl animate-pulse shadow-lg">
                            + {xpEarned} XP
                        </div>
                    )}
                </div>

                {/* Stats Comparison */}
                <div className={theme.card + " p-8 mb-8"}>
                    <h2 className={`text-3xl font-bold text-center mb-6 ${theme.textPrimary}`}>Match Stats</h2>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* Player 1 */}
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${theme.textSecondary} mb-2`}>{playerOneName}</div>
                            <div className="text-5xl font-black text-red-600">{playerOneScore}</div>
                            <div className={theme.textSecondary + " text-sm mt-1"}>Score</div>
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center">
                            <div className="text-4xl font-bold text-gray-400 dark:text-gray-500">VS</div>
                        </div>

                        {/* Player 2 */}
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${theme.textSecondary} mb-2`}>{playerTwoName}</div>
                            <div className="text-5xl font-black text-blue-600">{playerTwoScore}</div>
                            <div className={theme.textSecondary + " text-sm mt-1"}>Score</div>
                        </div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                        {/* Accuracy */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className={`text-lg font-semibold ${theme.textSecondary} mb-2`}>Accuracy</div>
                            <div className="flex justify-between items-center">
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{playerOneAccuracy.toFixed(0)}%</div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{playerTwoAccuracy.toFixed(0)}%</div>
                            </div>
                        </div>

                        {/* Average Speed */}
                        {playerOneAvgSpeed !== undefined && playerTwoAvgSpeed !== undefined && (
                            <div className="bg-gray-50 dark:bg-ink-3 rounded-xl p-4">
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Avg Speed</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-2xl font-bold text-red-600">{playerOneAvgSpeed.toFixed(1)}s</div>
                                    <div className="text-2xl font-bold text-blue-600">{playerTwoAvgSpeed.toFixed(1)}s</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 relative z-10">
                    <button
                        onClick={onPlayAgain}
                        className="flex-1 px-8 py-4 bg-emerald text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-emerald-dark hover:scale-105 transition transform active:scale-95"
                    >
                        Play Again
                    </button>
                    {onSwitchSides && (
                        <button
                            onClick={onSwitchSides}
                            className="flex-1 px-8 py-4 bg-purple-600 dark:bg-purple-700 text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-purple-700 dark:hover:bg-purple-800 hover:scale-105 transition transform active:scale-95"
                        >
                            Switch Sides
                        </button>
                    )}
                    {onNewPlayers && (
                        <button
                            onClick={onNewPlayers}
                            className="flex-1 px-8 py-4 bg-white dark:bg-fixed-dark text-ink dark:text-white border-4 border-gray-200 dark:border-border text-xl font-bold rounded-2xl shadow-xl hover:bg-gray-50 dark:hover:bg-fixed-medium hover:scale-105 transition transform active:scale-95"
                        >
                            New Players
                        </button>
                    )}
                    <button
                        onClick={onBackToMenu}
                        className="flex-1 px-8 py-4 bg-gray-800 dark:bg-black text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-black hover:scale-105 transition transform active:scale-95"
                    >
                        Quit
                    </button>
                </div>
            </div>
        </div>
    )
}
