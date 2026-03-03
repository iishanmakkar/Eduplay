'use client'

/**
 * Memory Matrix - Multiplayer Edition
 * Competitive memory pattern matching
 */

import { useState, useEffect } from 'react'
import { GameMode, PlayerSide } from '@/lib/multiplayer/game-modes'
import { PlayerSetupManager } from '@/lib/multiplayer/player-setup'
import { SplitScreenEngine, PlayerGameState } from '@/lib/multiplayer/split-screen'
import { CompetitionEngine } from '@/lib/multiplayer/competition'
import { soundManager } from '@/lib/multiplayer/sounds'
import PlayerSetupLobby from '@/components/multiplayer/PlayerSetupLobby'
import SplitScreenLayout from '@/components/multiplayer/SplitScreenLayout'
import VictoryScreen from '@/components/multiplayer/VictoryScreen'
import Countdown from '@/components/multiplayer/Countdown'
import SmartboardControls from '@/components/multiplayer/SmartboardControls'
import { MemoryMatrixContent, MemoryMatrixPattern } from '@/lib/game-engine/content-pools/memory-matrix'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

export default function MemoryMatrixMultiplayer() {
    const [gameState, setGameState] = useState<GameState>(GameState.SETUP)
    const [setupManager, setSetupManager] = useState<PlayerSetupManager | null>(null)
    const [splitScreenEngine] = useState(() => new SplitScreenEngine())
    const [competitionEngine] = useState(() => new CompetitionEngine())

    const [playerOneState, setPlayerOneState] = useState<PlayerGameState | null>(null)
    const [playerTwoState, setPlayerTwoState] = useState<PlayerGameState | null>(null)
    const [showOvertake, setShowOvertake] = useState(false)

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
        initializeMultiplayerGame()
        setGameState(GameState.PLAYING)
    }

    const initializeMultiplayerGame = () => {
        if (!setupManager) return

        const pool = MemoryMatrixContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            8,
            seed1,
            seed2
        )

        splitScreenEngine.initializeGame(p1Questions, p2Questions, 120)
        splitScreenEngine.startTimer(
            (timeLeft) => {
                const p1 = splitScreenEngine.getPlayerState(PlayerSide.LEFT)
                const p2 = splitScreenEngine.getPlayerState(PlayerSide.RIGHT)
                setPlayerOneState({ ...p1, timeRemaining: timeLeft })
                setPlayerTwoState({ ...p2, timeRemaining: timeLeft })
            },
            () => endGame()
        )

        setPlayerOneState(splitScreenEngine.getPlayerState(PlayerSide.LEFT))
        setPlayerTwoState(splitScreenEngine.getPlayerState(PlayerSide.RIGHT))
    }

    const handlePlayerAnswer = (side: PlayerSide, selectedCells: Set<number>) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as MemoryMatrixPattern
        const correctPattern = new Set(currentQuestion.content.pattern)

        const correctSelections = Array.from(selectedCells).filter(cell => correctPattern.has(cell)).length
        const accuracy = correctSelections / correctPattern.size
        const isCorrect = accuracy === 1 && selectedCells.size === correctPattern.size

        const points = isCorrect ? currentQuestion.points : Math.floor(currentQuestion.points * accuracy)
        splitScreenEngine.handleAnswer(side, isCorrect, points)

        const p1State = splitScreenEngine.getPlayerState(PlayerSide.LEFT)
        const p2State = splitScreenEngine.getPlayerState(PlayerSide.RIGHT)

        const overtake = competitionEngine.updateScores(p1State.score, p2State.score)

        if (overtake) {
            setShowOvertake(true)
            soundManager.playOvertake()
            setTimeout(() => setShowOvertake(false), 2000)
        }

        if (isCorrect) {
            soundManager.playCorrect()
        } else if (accuracy >= 0.7) {
            soundManager.playCorrect()
        } else {
            soundManager.playWrong()
        }

        setPlayerOneState(splitScreenEngine.getPlayerState(PlayerSide.LEFT))
        setPlayerTwoState(splitScreenEngine.getPlayerState(PlayerSide.RIGHT))

        if (splitScreenEngine.isGameOver()) {
            setTimeout(() => endGame(), 1000)
        }
    }

    const endGame = () => {
        splitScreenEngine.stopTimer()
        setGameState(GameState.VICTORY)
    }

    const handlePlayAgain = () => {
        competitionEngine.reset()
        splitScreenEngine.reset()
        setGameState(GameState.COUNTDOWN)
    }

    const handleSwitchSides = () => {
        setupManager?.switchSides()
        handlePlayAgain()
    }

    const handleNewPlayers = () => {
        competitionEngine.reset()
        splitScreenEngine.reset()
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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Memory Matrix Battle" />
    }

    if (gameState === GameState.COUNTDOWN) {
        return <Countdown onComplete={handleCountdownComplete} duration={3} />
    }

    if (gameState === GameState.VICTORY && setupManager && playerOneState && playerTwoState) {
        const winner = splitScreenEngine.getWinner()
        const stats = splitScreenEngine.getFinalStats()
        const { playerOne, playerTwo } = setupManager.getPlayers()

        return (
            <VictoryScreen
                winner={winner}
                playerOneName={playerOne.name}
                playerTwoName={playerTwo?.name || 'Player 2'}
                playerOneScore={stats.playerOne.score}
                playerTwoScore={stats.playerTwo.score}
                playerOneAccuracy={stats.playerOne.accuracy}
                playerTwoAccuracy={stats.playerTwo.accuracy}
                onPlayAgain={handlePlayAgain}
                onSwitchSides={handleSwitchSides}
                onNewPlayers={handleNewPlayers}
                onBackToMenu={handleBackToMenu}
            />
        )
    }

    if (gameState === GameState.PLAYING && setupManager && playerOneState && playerTwoState) {
        const { playerOne, playerTwo } = setupManager.getPlayers()

        return (
            <div className={smartboardMode ? 'smartboard-mode' : ''}>
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

                <SplitScreenLayout
                    playerOneName={playerOne.name}
                    playerTwoName={playerTwo?.name || 'Player 2'}
                    playerOneColor={playerOne.color}
                    playerTwoColor={playerTwo?.color || '#3B82F6'}
                    playerOneAvatar={playerOne.avatar}
                    playerTwoAvatar={playerTwo?.avatar || '🐯'}
                    playerOneScore={playerOneState.score}
                    playerTwoScore={playerTwoState.score}
                    showCompetitionBar={showCompetitionBar}
                    showOvertake={showOvertake}
                    smartboardMode={smartboardMode}
                    playerOneContent={
                        <MemoryMatrixPlayerSide
                            state={playerOneState}
                            onAnswer={(cells) => handlePlayerAnswer(PlayerSide.LEFT, cells)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <MemoryMatrixPlayerSide
                            state={playerTwoState}
                            onAnswer={(cells) => handlePlayerAnswer(PlayerSide.RIGHT, cells)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface MemoryMatrixPlayerSideProps {
    state: PlayerGameState
    onAnswer: (selectedCells: Set<number>) => void
    playerColor: string
}

function MemoryMatrixPlayerSide({ state, onAnswer, playerColor }: MemoryMatrixPlayerSideProps) {
    const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
    const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set())
    const [showFeedback, setShowFeedback] = useState(false)

    const currentQuestion = state.questions[state.currentIndex] as MemoryMatrixPattern | undefined
    const displayTime = currentQuestion?.content.displayTime || 5000

    useEffect(() => {
        if (!currentQuestion) return

        setPhase('memorize')
        setSelectedCells(new Set())
        setShowFeedback(false)

        const timer = setTimeout(() => {
            setPhase('recall')
        }, displayTime)

        return () => clearTimeout(timer)
    }, [state.currentIndex, displayTime, currentQuestion])

    if (!currentQuestion) return <div>Loading...</div>

    const { gridSize, pattern } = currentQuestion.content

    const handleCellClick = (index: number) => {
        if (phase !== 'recall' || showFeedback) return

        const newSelected = new Set(selectedCells)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }
        setSelectedCells(newSelected)
    }

    const handleSubmit = () => {
        if (phase !== 'recall' || showFeedback) return

        setShowFeedback(true)
        onAnswer(selectedCells)

        setTimeout(() => {
            setShowFeedback(false)
            setSelectedCells(new Set())
        }, 2000)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100

    return (
        <div className="space-y-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: playerColor }}
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: playerColor }}>
                        {state.correct}/{state.questions.length}
                    </div>
                    <div className="text-xs text-gray-600">Correct</div>
                </div>

                <div
                    className="px-3 py-1 rounded-full font-bold text-white text-sm"
                    style={{ backgroundColor: phase === 'memorize' ? '#3B82F6' : '#8B5CF6' }}
                >
                    {phase === 'memorize' ? '👀 MEMORIZE' : '🧠 RECALL'}
                </div>

                <div className="text-center">
                    <div className="text-2xl font-black text-gray-900">
                        {Math.round((state.correct / (state.currentIndex + 1)) * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                </div>
            </div>

            <div className="flex justify-center">
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                        maxWidth: `${gridSize * 60}px`
                    }}
                >
                    {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                        const isInPattern = pattern.includes(index)
                        const isSelected = selectedCells.has(index)
                        const showPattern = phase === 'memorize' || showFeedback

                        return (
                            <button
                                key={index}
                                onClick={() => handleCellClick(index)}
                                disabled={phase === 'memorize'}
                                className={`aspect-square rounded-lg transition-all duration-200 ${showPattern && isInPattern
                                    ? 'bg-purple-500'
                                    : isSelected
                                        ? showFeedback
                                            ? isInPattern
                                                ? 'bg-green-500'
                                                : 'bg-red-500'
                                            : 'bg-blue-400'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                                style={{
                                    width: '50px',
                                    height: '50px'
                                }}
                            />
                        )
                    })}
                </div>
            </div>

            {phase === 'recall' && !showFeedback && (
                <button
                    onClick={handleSubmit}
                    className="w-full p-3 text-white font-bold rounded-xl touch-target"
                    style={{ backgroundColor: playerColor }}
                >
                    Submit Answer
                </button>
            )}
        </div>
    )
}
