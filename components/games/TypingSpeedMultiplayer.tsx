'use client'

/**
 * Typing Speed - Multiplayer Edition
 * Competitive paragraph typing race with WPM tracking
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
import { TypingSpeedContent } from '@/lib/game-engine/content-pools/typing-speed'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

interface TypingQuestion {
    id: string
    content: { text: string; wpm: number }
    points: number
    difficulty: string
}

export default function TypingSpeedMultiplayer() {
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

        const pool = TypingSpeedContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            5, // 5 typing challenges per player
            seed1,
            seed2
        )

        splitScreenEngine.initializeGame(p1Questions, p2Questions, 120) // 2 minutes
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

    const handlePlayerAnswer = (side: PlayerSide, answer: string, wpm: number) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as TypingQuestion
        const isCorrect = answer.trim() === currentQuestion.content.text

        let points = currentQuestion.points

        // WPM bonus
        if (isCorrect && wpm > currentQuestion.content.wpm) {
            points *= 2
            soundManager.playSpeedBonus()
        }

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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Typing Speed Race" />
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
                        <TypingSpeedPlayerSide
                            state={playerOneState}
                            onAnswer={(answer, wpm) => handlePlayerAnswer(PlayerSide.LEFT, answer, wpm)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <TypingSpeedPlayerSide
                            state={playerTwoState}
                            onAnswer={(answer, wpm) => handlePlayerAnswer(PlayerSide.RIGHT, answer, wpm)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface TypingSpeedPlayerSideProps {
    state: PlayerGameState
    onAnswer: (answer: string, wpm: number) => void
    playerColor: string
}

function TypingSpeedPlayerSide({ state, onAnswer, playerColor }: TypingSpeedPlayerSideProps) {
    const [userInput, setUserInput] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [startTime, setStartTime] = useState(Date.now())
    const [currentWPM, setCurrentWPM] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setStartTime(Date.now())
        inputRef.current?.focus()
    }, [state.currentIndex])

    useEffect(() => {
        if (userInput.length > 0) {
            const timeSpent = (Date.now() - startTime) / 1000 / 60 // minutes
            const wpm = Math.round((userInput.length / 5) / timeSpent)
            setCurrentWPM(wpm)
        }
    }, [userInput, startTime])

    const currentQuestion = state.questions[state.currentIndex] as TypingQuestion
    if (!currentQuestion) return <div>Loading...</div>

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (showFeedback || !userInput.trim()) return

        const timeSpent = (Date.now() - startTime) / 1000 / 60
        const wpm = Math.round((userInput.length / 5) / timeSpent)

        setShowFeedback(true)
        onAnswer(userInput, wpm)

        setTimeout(() => {
            setUserInput('')
            setShowFeedback(false)
            setCurrentWPM(0)
            inputRef.current?.focus()
        }, 1500)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100
    const isCorrect = userInput.trim() === currentQuestion.content.text

    return (
        <div className="space-y-6">
            {/* Progress */}
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
                    <div className="text-sm text-gray-600">Completed</div>
                </div>

                <div className="text-center">
                    <div className="text-4xl font-black text-gray-900">
                        {currentWPM}
                    </div>
                    <div className="text-sm text-gray-600">WPM</div>
                </div>

                <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">
                        {Math.round((state.correct / (state.currentIndex + 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
            </div>

            {/* Text to Type */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-gray-600 mb-4 text-center">
                    Challenge {state.currentIndex + 1} of {state.questions.length}
                </div>

                <div className="text-xl font-mono leading-relaxed text-gray-900 bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
                    {currentQuestion.content.text}
                </div>

                <div className="text-center text-sm text-gray-600">
                    Target: {currentQuestion.content.wpm} WPM for bonus!
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Start typing..."
                    className={`w-full p-6 text-xl font-mono rounded-xl border-4 transition-all touch-target ${showFeedback
                        ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-300 focus:outline-none'
                        }`}
                    style={{
                        borderColor: !showFeedback ? playerColor : undefined
                    }}
                    autoComplete="off"
                />

                <button
                    type="submit"
                    disabled={showFeedback || !userInput.trim()}
                    className="w-full py-6 text-2xl font-bold rounded-xl transition-all touch-target"
                    style={{
                        backgroundColor: showFeedback || !userInput.trim() ? '#D1D5DB' : playerColor,
                        color: 'white'
                    }}
                >
                    Submit ({currentWPM} WPM)
                </button>
            </form>
        </div>
    )
}
