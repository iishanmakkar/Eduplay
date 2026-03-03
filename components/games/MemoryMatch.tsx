'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { MemoryMatchContent, MemoryMatchConfig, MemoryCard } from '@/lib/game-engine/content-pools/memory-match'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface MemoryMatchProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function MemoryMatch({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD
}: MemoryMatchProps) {
    // Game state
    const [config, setConfig] = useState<MemoryMatchConfig | null>(null)
    const [cards, setCards] = useState<MemoryCard[]>([])
    const [flippedIndices, setFlippedIndices] = useState<number[]>([])
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
    const [gameStarted, setGameStarted] = useState(false)
    const [gameComplete, setGameComplete] = useState(false)

    // Scoring state
    const [score, setScore] = useState(0)
    const [moves, setMoves] = useState(0)
    const [pairsFound, setPairsFound] = useState(0)
    const [streak, setStreak] = useState(0)

    // Time tracking
    const [timeLeft, setTimeLeft] = useState(0)
    const [startTime, setStartTime] = useState(Date.now())

    // UI state
    const [showCountdown, setShowCountdown] = useState(true)
    const [isChecking, setIsChecking] = useState(false)

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    // Initialize game
    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = MemoryMatchContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(Number(seed))
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)

        // Get one memory match config
        const sessionQuestions = generator.generateSession(pool, 1, difficultyMix)
        const gameConfig = sessionQuestions[0] as MemoryMatchConfig

        setConfig(gameConfig)

        // Shuffle cards
        const shuffledCards = MemoryMatchContent.shuffleCards(gameConfig.content.cards)
        setCards(shuffledCards)

        setTimeLeft(gameConfig.timeLimit || 180)
        setStartTime(Date.now())
        setGameStarted(true)
    }

    // Timer
    useEffect(() => {
        if (!gameStarted || gameComplete || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, gameComplete]) // Removed timeLeft dependency

    // Safety: Ensure game is marked started if cards exist
    useEffect(() => {
        if (cards.length > 0 && !gameStarted && timeLeft > 0 && !gameComplete) {
            setGameStarted(true)
        }
    }, [cards.length, gameStarted, timeLeft, gameComplete])

    // Check for match when two cards are flipped
    useEffect(() => {
        if (flippedIndices.length === 2) {
            // isChecking is already set in handleCardClick for immediate feedback,
            // but we ensure logic runs here
            checkForMatch()
        }
    }, [flippedIndices])

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index)) return
        if (matchedPairs.has(cards[index].emoji)) return

        const newFlipped = [...flippedIndices, index]
        setFlippedIndices(newFlipped)

        // Immediate lock to prevent 3rd click race condition
        if (newFlipped.length === 2) {
            setIsChecking(true)
        }
    }

    const checkForMatch = () => {
        const [firstIndex, secondIndex] = flippedIndices
        const firstCard = cards[firstIndex]
        const secondCard = cards[secondIndex]

        setMoves(prev => prev + 1)

        setTimeout(() => {
            if (firstCard.emoji === secondCard.emoji) {
                // Match found!
                const newMatchedPairs = new Set(matchedPairs)
                newMatchedPairs.add(firstCard.emoji)
                setMatchedPairs(newMatchedPairs)

                const newStreak = streak + 1
                setStreak(newStreak)
                setPairsFound(prev => prev + 1)

                // Calculate XP based on speed and efficiency
                const timeSpent = (Date.now() - startTime) / 1000
                const efficiency = config ? moves / config.content.optimalMoves : 1
                const efficiencyBonus = efficiency < 1 ? 1.5 : efficiency < 1.2 ? 1.2 : 1

                const xpResult = ScoringEngine.calculateXP({
                    baseScore: config?.points || 10,
                    accuracy: efficiencyBonus,
                    timeSpent: timeSpent / (newMatchedPairs.size || 1),
                    expectedTime: 10,
                    streak: newStreak,
                    hintsUsed: 0,
                    mistakes: 0,
                    difficulty,
                    perfectRound: false
                })

                setScore(prev => prev + xpResult.totalXP)

                feedbackSystem.current.showCorrectAnimation()
                feedbackSystem.current.showXPPopup(xpResult.totalXP)

                const combo = ScoringEngine.getComboLevel(newStreak)
                if (newStreak >= 3) {
                    feedbackSystem.current.showComboAnimation(combo.multiplier, newStreak)
                }

                toast.success(`${getEncouragingMessage('excellent')} +${xpResult.totalXP} XP`, {
                    icon: '✨',
                    duration: 1000
                })

                // Check if game complete
                if (config && newMatchedPairs.size === config.content.cards.length / 2) {
                    setTimeout(() => endGame(true), 500)
                }
            } else {
                // No match
                setStreak(0)
                feedbackSystem.current.showWrongAnimation()
            }

            setFlippedIndices([])
            setIsChecking(false)
        }, 800)
    }

    const endGame = (completed: boolean) => {
        setGameComplete(true)
        setGameStarted(false)

        if (completed) {
            const efficiency = config ? moves / config.content.optimalMoves : 1
            if (efficiency <= 1.1) {
                feedbackSystem.current.triggerConfetti('perfect')
            } else if (efficiency <= 1.3) {
                feedbackSystem.current.triggerConfetti('amazing')
            }
        }

        onGameEnd(score, pairsFound, config?.content.cards.length ? config.content.cards.length / 2 : 0)
    }

    if (showCountdown || !config) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎴</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Memory Match...</div>
                </div>
            </div>
        )
    }

    const { gridSize, theme, optimalMoves } = config.content
    const totalPairs = cards.length / 2
    const progress = (pairsFound / totalPairs) * 100
    const efficiency = moves > 0 ? (moves / optimalMoves) : 0
    const combo = ScoringEngine.getComboLevel(streak)

    // Theme colors
    const themeColors = {
        animals: 'from-green-500 to-green-600',
        fruits: 'from-red-500 to-red-600',
        vehicles: 'from-blue-500 to-blue-600',
        emojis: 'from-yellow-500 to-yellow-600',
        nature: 'from-emerald-500 to-emerald-600',
        sports: 'from-orange-500 to-orange-600',
        space: 'from-indigo-500 to-purple-600'
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Background gradient */}
            <div
                className="absolute inset-0 opacity-5 transition-all duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${combo.color} 0%, transparent 100%)`
                }}
            />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className={`h-full bg-gradient-to-r ${themeColors[theme]} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">⏱️</div>
                        <div>
                            <div className={`text-3xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="text-sm text-gray-600">Time Left</div>
                        </div>
                    </div>

                    {/* Theme Badge */}
                    <div className={`px-4 py-2 rounded-full font-bold text-white bg-gradient-to-r ${themeColors[theme]}`}>
                        {theme.toUpperCase()} - {gridSize}x{gridSize}
                    </div>

                    {/* Combo Indicator */}
                    {streak >= 3 && (
                        <div
                            id="combo-indicator"
                            className="px-4 py-2 rounded-full font-bold text-white combo-active"
                            style={{ backgroundColor: combo.color }}
                        >
                            {streak}x {combo.label}
                        </div>
                    )}
                </div>

                {/* Score */}
                <div className="text-right">
                    <div className={`text-4xl font-bold bg-gradient-to-r ${themeColors[theme]} bg-clip-text text-transparent`}>
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            {/* Game Grid */}
            <div
                className={`grid gap-3 mb-6 relative z-10`}
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
                }}
            >
                {cards.map((card, index) => {
                    const isFlipped = flippedIndices.includes(index)
                    const isMatched = matchedPairs.has(card.emoji)

                    return (
                        <button
                            key={index}
                            onClick={() => handleCardClick(index)}
                            disabled={isMatched || isChecking}
                            className={`aspect-square rounded-xl font-bold text-4xl transition-all duration-300 transform touch-manipulation select-none ${isFlipped || isMatched
                                ? `bg-gradient-to-br ${themeColors[theme]} text-white scale-105`
                                : 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 hover:scale-105'
                                } ${isMatched ? 'opacity-50' : ''}`}
                            style={{
                                perspective: '1000px'
                            }}
                        >
                            {isFlipped || isMatched ? card.emoji : '?'}
                        </button>
                    )
                })}
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <div className="font-bold text-gray-900">{pairsFound}/{totalPairs}</div>
                        <div className="text-gray-600">Pairs Found</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">👆</span>
                    <div>
                        <div className="font-bold text-gray-900">{moves}</div>
                        <div className="text-gray-600">Moves</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <div className={`font-bold ${efficiency <= 1.1 ? 'text-green-600' : efficiency <= 1.3 ? 'text-blue-600' : 'text-gray-900'}`}>
                            {efficiency > 0 ? Math.round(efficiency * 100) : 0}%
                        </div>
                        <div className="text-gray-600">Efficiency</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <div>
                        <div className="font-bold text-gray-900">{streak}</div>
                        <div className="text-gray-600">Streak</div>
                    </div>
                </div>
            </div>

            {/* Optimal Moves Hint */}
            <div className="mt-4 text-center text-sm text-gray-600">
                Optimal moves: {optimalMoves} | Current: {moves}
            </div>
        </div>
    )
}
