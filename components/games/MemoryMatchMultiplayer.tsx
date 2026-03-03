'use client'

/**
 * Memory Match - Multiplayer Edition
 * Competitive card matching with turn-based gameplay
 */

import { useState, useEffect } from 'react'
import { GameMode, PlayerSide } from '@/lib/multiplayer/game-modes'
import { PlayerSetupManager } from '@/lib/multiplayer/player-setup'
import { CompetitionEngine } from '@/lib/multiplayer/competition'
import { soundManager } from '@/lib/multiplayer/sounds'
import PlayerSetupLobby from '@/components/multiplayer/PlayerSetupLobby'
import VictoryScreen from '@/components/multiplayer/VictoryScreen'
import Countdown from '@/components/multiplayer/Countdown'
import SmartboardControls from '@/components/multiplayer/SmartboardControls'
import { MemoryMatchContent, MemoryCard } from '@/lib/game-engine/content-pools/memory-match'
import CompetitionBar from '@/components/multiplayer/CompetitionBar'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

interface PlayerStats {
    score: number
    pairsFound: number
    moves: number
    accuracy: number
}

interface GameMemoryCard extends MemoryCard {
    pairId: string
}

export default function MemoryMatchMultiplayer() {
    const [gameState, setGameState] = useState<GameState>(GameState.SETUP)
    const [setupManager, setSetupManager] = useState<PlayerSetupManager | null>(null)
    const [competitionEngine] = useState(() => new CompetitionEngine())

    // Game state
    const [cards, setCards] = useState<GameMemoryCard[]>([])
    const [flippedIndices, setFlippedIndices] = useState<number[]>([])
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
    const [currentTurn, setCurrentTurn] = useState<PlayerSide>(PlayerSide.LEFT)

    // Player stats
    const [playerOneStats, setPlayerOneStats] = useState<PlayerStats>({ score: 0, pairsFound: 0, moves: 0, accuracy: 0 })
    const [playerTwoStats, setPlayerTwoStats] = useState<PlayerStats>({ score: 0, pairsFound: 0, moves: 0, accuracy: 0 })
    const [showOvertake, setShowOvertake] = useState(false)

    // Settings
    const [smartboardMode, setSmartboardMode] = useState(false)
    const [touchOptimized, setTouchOptimized] = useState(true)
    const [soundEffects, setSoundEffects] = useState(true)
    const [showCompetitionBar, setShowCompetitionBar] = useState(true)

    useEffect(() => {
        soundManager.setEnabled(soundEffects)
    }, [soundEffects])

    const handleStartGame = (manager: PlayerSetupManager) => {
        setSetupManager(manager)
        setGameState(GameState.COUNTDOWN)
    }

    const handleCountdownComplete = () => {
        initializeGame()
        setGameState(GameState.PLAYING)
    }

    const initializeGame = () => {
        const pool = MemoryMatchContent.generateContentPool()
        const pairCount = 8 // 8 pairs = 16 cards

        // Use medium difficulty for multiplayer
        const deck = pool.medium[0]
        const allCards = deck.content.cards

        // Select random pairs
        const selectedPairs = allCards.slice(0, pairCount)

        // Create card pairs
        const gameCards: GameMemoryCard[] = []
        selectedPairs.forEach((pair: MemoryCard, index: number) => {
            gameCards.push({ ...pair, id: `${index}-a`, pairId: index.toString() })
            gameCards.push({ ...pair, id: `${index}-b`, pairId: index.toString() })
        })

        // Shuffle cards
        const shuffled = gameCards.sort(() => Math.random() - 0.5)
        setCards(shuffled)
        setCurrentTurn(PlayerSide.LEFT)
    }

    const handleCardClick = (index: number) => {
        if (flippedIndices.length >= 2) return
        if (flippedIndices.includes(index)) return
        if (matchedPairs.has(cards[index].pairId)) return

        const newFlipped = [...flippedIndices, index]
        setFlippedIndices(newFlipped)

        if (newFlipped.length === 2) {
            checkMatch(newFlipped)
        }
    }

    const checkMatch = (indices: number[]) => {
        const [first, second] = indices
        const card1 = cards[first]
        const card2 = cards[second]

        const isMatch = card1.pairId === card2.pairId

        setTimeout(() => {
            if (isMatch) {
                // Match found!
                const newMatched = new Set(matchedPairs)
                newMatched.add(card1.pairId)
                setMatchedPairs(newMatched)

                const points = 100

                if (currentTurn === PlayerSide.LEFT) {
                    const newStats = {
                        ...playerOneStats,
                        score: playerOneStats.score + points,
                        pairsFound: playerOneStats.pairsFound + 1,
                        moves: playerOneStats.moves + 1
                    }
                    setPlayerOneStats(newStats)

                    const overtake = competitionEngine.updateScores(newStats.score, playerTwoStats.score)
                    if (overtake) {
                        setShowOvertake(true)
                        soundManager.playOvertake()
                        setTimeout(() => setShowOvertake(false), 2000)
                    }
                } else {
                    const newStats = {
                        ...playerTwoStats,
                        score: playerTwoStats.score + points,
                        pairsFound: playerTwoStats.pairsFound + 1,
                        moves: playerTwoStats.moves + 1
                    }
                    setPlayerTwoStats(newStats)

                    const overtake = competitionEngine.updateScores(playerOneStats.score, newStats.score)
                    if (overtake) {
                        setShowOvertake(true)
                        soundManager.playOvertake()
                        setTimeout(() => setShowOvertake(false), 2000)
                    }
                }

                soundManager.playCorrect()

                // Check if game over
                if (newMatched.size === cards.length / 2) {
                    setTimeout(() => endGame(), 1000)
                }
            } else {
                // No match - switch turns
                soundManager.playWrong()
                setCurrentTurn(currentTurn === PlayerSide.LEFT ? PlayerSide.RIGHT : PlayerSide.LEFT)

                if (currentTurn === PlayerSide.LEFT) {
                    setPlayerOneStats({ ...playerOneStats, moves: playerOneStats.moves + 1 })
                } else {
                    setPlayerTwoStats({ ...playerTwoStats, moves: playerTwoStats.moves + 1 })
                }
            }

            setFlippedIndices([])
        }, 1000)
    }

    const endGame = () => {
        // Calculate accuracy
        const p1Accuracy = playerOneStats.moves > 0 ? (playerOneStats.pairsFound / playerOneStats.moves) * 100 : 0
        const p2Accuracy = playerTwoStats.moves > 0 ? (playerTwoStats.pairsFound / playerTwoStats.moves) * 100 : 0

        setPlayerOneStats({ ...playerOneStats, accuracy: p1Accuracy })
        setPlayerTwoStats({ ...playerTwoStats, accuracy: p2Accuracy })

        setGameState(GameState.VICTORY)
    }

    const handlePlayAgain = () => {
        competitionEngine.reset()
        setPlayerOneStats({ score: 0, pairsFound: 0, moves: 0, accuracy: 0 })
        setPlayerTwoStats({ score: 0, pairsFound: 0, moves: 0, accuracy: 0 })
        setMatchedPairs(new Set())
        setFlippedIndices([])
        setGameState(GameState.COUNTDOWN)
    }

    const handleSwitchSides = () => {
        setupManager?.switchSides()
        handlePlayAgain()
    }

    const handleNewPlayers = () => {
        competitionEngine.reset()
        setGameState(GameState.SETUP)
    }

    const handleBackToMenu = () => {
        window.location.href = '/dashboard/student/games'
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    if (gameState === GameState.SETUP) {
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Memory Match Battle" />
    }

    if (gameState === GameState.COUNTDOWN) {
        return <Countdown onComplete={handleCountdownComplete} duration={3} />
    }

    if (gameState === GameState.VICTORY && setupManager) {
        const { playerOne, playerTwo } = setupManager.getPlayers()
        const winner = playerOneStats.score > playerTwoStats.score ? PlayerSide.LEFT :
            playerTwoStats.score > playerOneStats.score ? PlayerSide.RIGHT : 'tie'

        return (
            <VictoryScreen
                winner={winner}
                playerOneName={playerOne.name}
                playerTwoName={playerTwo?.name || 'Player 2'}
                playerOneScore={playerOneStats.score}
                playerTwoScore={playerTwoStats.score}
                playerOneAccuracy={playerOneStats.accuracy}
                playerTwoAccuracy={playerTwoStats.accuracy}
                onPlayAgain={handlePlayAgain}
                onSwitchSides={handleSwitchSides}
                onNewPlayers={handleNewPlayers}
                onBackToMenu={handleBackToMenu}
            />
        )
    }

    if (gameState === GameState.PLAYING && setupManager) {
        const { playerOne, playerTwo } = setupManager.getPlayers()

        return (
            <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 ${smartboardMode ? 'smartboard-mode' : ''}`}>
                <SmartboardControls
                    smartboardMode={smartboardMode}
                    touchOptimized={touchOptimized}
                    soundEffects={soundEffects}
                    showCompetitionBar={showCompetitionBar}
                    onToggleSmartboard={setSmartboardMode}
                    onToggleTouch={setTouchOptimized}
                    onToggleSounds={setSoundEffects}
                    onToggleCompetitionBar={setShowCompetitionBar}
                    onToggleFullscreen={toggleFullscreen}
                />

                {/* Competition Bar */}
                {showCompetitionBar && (
                    <div className="bg-white shadow-lg">
                        <CompetitionBar
                            playerOneScore={playerOneStats.score}
                            playerTwoScore={playerTwoStats.score}
                            playerOneName={playerOne.name}
                            playerTwoName={playerTwo?.name || 'Player 2'}
                            playerOneColor={playerOne.color}
                            playerTwoColor={playerTwo?.color || '#3B82F6'}
                            showOvertake={showOvertake}
                        />
                    </div>
                )}

                {/* Turn Indicator */}
                <div className="text-center py-6">
                    <div className="inline-block px-8 py-4 rounded-2xl shadow-lg" style={{
                        backgroundColor: currentTurn === PlayerSide.LEFT ? playerOne.color : playerTwo?.color || '#3B82F6'
                    }}>
                        <div className="text-3xl font-black text-white">
                            {currentTurn === PlayerSide.LEFT ? `${playerOne.avatar} ${playerOne.name}'s Turn` : `${playerTwo?.avatar || '🐯'} ${playerTwo?.name || 'Player 2'}'s Turn`}
                        </div>
                    </div>
                </div>

                {/* Game Board */}
                <div className="max-w-4xl mx-auto px-4 pb-8">
                    <div className="grid grid-cols-4 gap-4">
                        {cards.map((card, index) => {
                            const isFlipped = flippedIndices.includes(index) || matchedPairs.has(card.pairId)

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(index)}
                                    disabled={isFlipped || flippedIndices.length >= 2}
                                    className={`aspect-square rounded-xl text-6xl font-bold transition-all duration-300 touch-target ${isFlipped
                                        ? 'bg-white shadow-xl scale-105'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105 shadow-lg'
                                        } ${matchedPairs.has(card.pairId) ? 'opacity-50' : ''}`}
                                >
                                    {isFlipped ? card.emoji : '❓'}
                                </button>
                            )
                        })}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">{playerOne.avatar}</div>
                                <div className="text-2xl font-bold" style={{ color: playerOne.color }}>
                                    {playerOne.name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pairs:</span>
                                    <span className="font-bold">{playerOneStats.pairsFound}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Moves:</span>
                                    <span className="font-bold">{playerOneStats.moves}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Score:</span>
                                    <span className="font-bold text-2xl" style={{ color: playerOne.color }}>
                                        {playerOneStats.score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">{playerTwo?.avatar || '🐯'}</div>
                                <div className="text-2xl font-bold" style={{ color: playerTwo?.color || '#3B82F6' }}>
                                    {playerTwo?.name || 'Player 2'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pairs:</span>
                                    <span className="font-bold">{playerTwoStats.pairsFound}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Moves:</span>
                                    <span className="font-bold">{playerTwoStats.moves}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Score:</span>
                                    <span className="font-bold text-2xl" style={{ color: playerTwo?.color || '#3B82F6' }}>
                                        {playerTwoStats.score}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
