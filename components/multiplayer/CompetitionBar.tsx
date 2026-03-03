'use client'

/**
 * Competition Bar
 * Center tug-of-war bar showing live competition
 */

import { useEffect, useState } from 'react'
import { PlayerSide } from '@/lib/multiplayer/game-modes'

interface CompetitionBarProps {
    playerOneScore: number
    playerTwoScore: number
    playerOneName: string
    playerTwoName: string
    playerOneColor: string
    playerTwoColor: string
    showOvertake?: boolean
}

export default function CompetitionBar({
    playerOneScore,
    playerTwoScore,
    playerOneName,
    playerTwoName,
    playerOneColor,
    playerTwoColor,
    showOvertake = false
}: CompetitionBarProps) {
    const [percentage, setPercentage] = useState(50)
    const [momentum, setMomentum] = useState<'left' | 'right' | 'neutral'>('neutral')

    useEffect(() => {
        const totalScore = playerOneScore + playerTwoScore
        if (totalScore === 0) {
            setPercentage(50)
            setMomentum('neutral')
            return
        }

        // Calculate percentage (0-100, where 0 = P1 dominating, 100 = P2 dominating)
        const p2Percentage = (playerTwoScore / totalScore) * 100
        setPercentage(p2Percentage)

        // Determine momentum
        if (playerOneScore > playerTwoScore + 20) {
            setMomentum('left')
        } else if (playerTwoScore > playerOneScore + 20) {
            setMomentum('right')
        } else {
            setMomentum('neutral')
        }
    }, [playerOneScore, playerTwoScore])

    const getLeader = (): 'left' | 'right' | 'tie' => {
        if (playerOneScore > playerTwoScore) return 'left'
        if (playerTwoScore > playerOneScore) return 'right'
        return 'tie'
    }

    const leader = getLeader()

    return (
        <div className="w-full py-6">
            {/* Overtake Animation */}
            {showOvertake && (
                <div className="text-center mb-4">
                    <div className="overtake-effect inline-block text-6xl font-black text-yellow-500">
                        ⚡ OVERTAKE! ⚡
                    </div>
                </div>
            )}

            {/* Score Display */}
            <div className="flex justify-between items-center mb-4 px-4">
                <div className={`text-3xl font-black ${leader === 'left' ? 'scale-110' : ''}`} style={{ color: playerOneColor }}>
                    {playerOneName}: {playerOneScore}
                </div>
                <div className="text-2xl font-bold text-gray-500">VS</div>
                <div className={`text-3xl font-black ${leader === 'right' ? 'scale-110' : ''}`} style={{ color: playerTwoColor }}>
                    {playerTwoName}: {playerTwoScore}
                </div>
            </div>

            {/* Tug-of-War Bar */}
            <div className="relative h-16 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                {/* Player 1 Side */}
                <div
                    className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
                    style={{
                        width: `${100 - percentage}%`,
                        backgroundColor: playerOneColor
                    }}
                />

                {/* Player 2 Side */}
                <div
                    className="absolute right-0 top-0 h-full transition-all duration-500 ease-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: playerTwoColor
                    }}
                />

                {/* Center Line */}
                <div className="absolute left-1/2 top-0 h-full w-1 bg-white transform -translate-x-1/2 z-10" />

                {/* Momentum Arrows */}
                {momentum === 'left' && (
                    <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 momentum-arrow">
                        <div className="text-4xl">◀◀◀</div>
                    </div>
                )}
                {momentum === 'right' && (
                    <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 momentum-arrow">
                        <div className="text-4xl">▶▶▶</div>
                    </div>
                )}
            </div>

            {/* Leader Indicator */}
            <div className="text-center mt-4">
                {leader === 'tie' ? (
                    <div className="text-2xl font-bold text-gray-600">🤝 TIED!</div>
                ) : (
                    <div className="text-2xl font-bold" style={{ color: leader === 'left' ? playerOneColor : playerTwoColor }}>
                        {leader === 'left' ? `${playerOneName} LEADING!` : `${playerTwoName} LEADING!`}
                    </div>
                )}
            </div>
        </div>
    )
}
