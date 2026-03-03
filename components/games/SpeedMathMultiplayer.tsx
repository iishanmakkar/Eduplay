'use client'

/**
 * Speed Math - Multiplayer Edition
 * Competitive 1v1 math battle with split-screen gameplay
 */

import { useState, useEffect, useRef } from 'react'
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
import { SpeedMathContent, MathProblem } from '@/lib/game-engine/content-pools/speed-math'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

export default function SpeedMathMultiplayer() {
    const [gameState, setGameState] = useState<GameState>(GameState.SETUP)
    const [setupManager, setSetupManager] = useState<PlayerSetupManager | null>(null)
    const [splitScreenEngine] = useState(() => new SplitScreenEngine())
    const [competitionEngine] = useState(() => new CompetitionEngine())

    // Player states
    const [playerOneState, setPlayerOneState] = useState<PlayerGameState | null>(null)
    const [playerTwoState, setPlayerTwoState] = useState<PlayerGameState | null>(null)

    // Competition state
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
        initializeMultiplayerGame()
        setGameState(GameState.PLAYING)
    }

    const initializeMultiplayerGame = () => {
        if (!setupManager) return

        // Generate content pool
        const pool = SpeedMathContent.generateContentPool()

        // Generate independent questions for each player
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000
        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            15, // 15 questions per player
            seed1,
            seed2
        )

        // Initialize game
        splitScreenEngine.initializeGame(p1Questions, p2Questions, 60) // 60 second time limit

        // Start timer
        splitScreenEngine.startTimer(
            (timeLeft) => {
                // Update time for both players
                const p1 = splitScreenEngine.getPlayerState(PlayerSide.LEFT)
                const p2 = splitScreenEngine.getPlayerState(PlayerSide.RIGHT)
                setPlayerOneState({ ...p1, timeRemaining: timeLeft })
                setPlayerTwoState({ ...p2, timeRemaining: timeLeft })
            },
            () => {
                // Time's up!
                endGame()
            }
        )

        // Set initial states
        setPlayerOneState(splitScreenEngine.getPlayerState(PlayerSide.LEFT))
        setPlayerTwoState(splitScreenEngine.getPlayerState(PlayerSide.RIGHT))
    }

    const handlePlayerAnswer = (side: PlayerSide, answer: number, reactionTime: number) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as MathProblem
        const isCorrect = answer === currentQuestion.correctAnswer

        let points = 0
        if (isCorrect) {
            const basePoints = currentQuestion.points

            // Apply Bonuses
            const speedMultiplier = competitionEngine.calculateSpeedBonus(reactionTime)
            const comebackMultiplier = competitionEngine.calculateComebackBonus(side)

            points = Math.floor(basePoints * speedMultiplier * comebackMultiplier)

            // Show bonus toast if significant
            if (speedMultiplier > 1.0) toast.success(`Speed Bonus! ${speedMultiplier}x`, { id: `speed-${side}`, duration: 1000 })
            if (comebackMultiplier > 1.0) toast.success(`Comeback Bonus! ${comebackMultiplier}x`, { id: `comeback-${side}`, duration: 1000 })
        }

        // Handle answer in split-screen engine (updates streak/combo)
        splitScreenEngine.handleAnswer(side, isCorrect, points)

        // Update competition engine
        const p1State = splitScreenEngine.getPlayerState(PlayerSide.LEFT)
        const p2State = splitScreenEngine.getPlayerState(PlayerSide.RIGHT)

        const overtake = competitionEngine.updateScores(p1State.score, p2State.score)

        if (overtake) {
            setShowOvertake(true)
            soundManager.playOvertake()
            setTimeout(() => setShowOvertake(false), 2000)
        }

        // Play sound
        if (isCorrect) {
            soundManager.playCorrect()
            if (state.streak >= 3) {
                soundManager.playCombo(state.combo)
            }
        } else {
            soundManager.playWrong()
        }

        // Update states
        setPlayerOneState(splitScreenEngine.getPlayerState(PlayerSide.LEFT))
        setPlayerTwoState(splitScreenEngine.getPlayerState(PlayerSide.RIGHT))

        // Check if game over
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
        // Navigate back to game selection
        window.location.href = '/dashboard/student/games'
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    // Setup screen
    if (gameState === GameState.SETUP) {
        return (
            <PlayerSetupLobby
                onStartGame={handleStartGame}
                gameName="Speed Math Battle"
            />
        )
    }

    // Countdown
    if (gameState === GameState.COUNTDOWN) {
        return (
            <Countdown
                onComplete={handleCountdownComplete}
                duration={3}
            />
        )
    }

    // Victory screen
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

    // Playing - Split screen
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
                        <SpeedMathPlayerSide
                            state={playerOneState}
                            onAnswer={(answer, reactionTime) => handlePlayerAnswer(PlayerSide.LEFT, answer, reactionTime)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <SpeedMathPlayerSide
                            state={playerTwoState}
                            onAnswer={(answer, reactionTime) => handlePlayerAnswer(PlayerSide.RIGHT, answer, reactionTime)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

// Individual player side component
interface SpeedMathPlayerSideProps {
    state: PlayerGameState
    onAnswer: (answer: number, reactionTime: number) => void
    playerColor: string
}

function SpeedMathPlayerSide({ state, onAnswer, playerColor }: SpeedMathPlayerSideProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const isSubmitting = useRef(false)
    const questionStartTime = useRef(Date.now())

    const currentQuestion = state.questions[state.currentIndex] as MathProblem

    // Reset timer on new question
    useEffect(() => {
        questionStartTime.current = Date.now()
    }, [state.currentIndex])

    if (!currentQuestion) return <div>Loading...</div>

    const handleAnswer = (answer: number, e: React.PointerEvent) => {
        e.preventDefault() // Prevent ghost clicks and scrolling
        e.stopPropagation() // Isolate touch

        if (showFeedback || isSubmitting.current) return
        isSubmitting.current = true

        const reactionTime = Date.now() - questionStartTime.current

        setSelectedAnswer(answer)
        setShowFeedback(true)

        // Pass reaction time to parent
        onAnswer(answer, reactionTime)

        // Reset after delay
        setTimeout(() => {
            setSelectedAnswer(null)
            setShowFeedback(false)
            isSubmitting.current = false
        }, 1000)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100
    const combo = ScoringEngine.getComboLevel(state.streak)

    return (
        <div className="space-y-6 select-none touch-none">
            {/* Progress Bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: playerColor }}
                />
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center">
                <div className="text-center">
                    <div className="text-3xl font-black" style={{ color: playerColor }}>
                        {state.correct}/{state.questions.length}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                </div>

                {state.streak >= 3 && (
                    <div
                        className="px-4 py-2 rounded-full font-bold text-white"
                        style={{ backgroundColor: combo.color }}
                    >
                        🔥 {state.streak}x Streak!
                    </div>
                )}

                <div className="text-center">
                    <div className="text-3xl font-black" style={{ color: playerColor }}>
                        {combo.multiplier}x
                    </div>
                    <div className="text-sm text-gray-600">Multiplier</div>
                </div>
            </div>

            {/* Question */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-sm text-gray-600 mb-2">
                    Question {state.currentIndex + 1} of {state.questions.length}
                </div>
                <div className="text-5xl font-black text-center py-8 text-gray-900">
                    {currentQuestion.content.question}
                </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onPointerDown={(e) => handleAnswer(option, e)}
                        disabled={showFeedback}
                        className={`p-6 text-3xl font-bold rounded-xl transition-all touch-target select-none ${showFeedback
                            ? option === currentQuestion.correctAnswer
                                ? 'bg-green-500 text-white scale-105'
                                : option === selectedAnswer
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                            : 'bg-white border-4 hover:scale-105 text-gray-900 active:scale-95'
                            }`}
                        style={{
                            borderColor: showFeedback ? 'transparent' : playerColor,
                            touchAction: 'none'
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}
