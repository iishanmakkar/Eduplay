'use client'

/**
 * Focus Challenge - Multiplayer Edition
 * Competitive concentration and counting game
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
import { FocusChallengeContent, FocusChallengeQuestion } from '@/lib/game-engine/content-pools/focus-challenge'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

export default function FocusChallengeMultiplayer() {
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

        const pool = FocusChallengeContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            10,
            seed1,
            seed2
        )

        splitScreenEngine.initializeGame(p1Questions, p2Questions, 90)
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

    const handlePlayerAnswer = (side: PlayerSide, userCount: number) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as FocusChallengeQuestion
        const isCorrect = userCount === currentQuestion.correctAnswer

        splitScreenEngine.handleAnswer(side, isCorrect, isCorrect ? currentQuestion.points : 0)

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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Focus Challenge Battle" />
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
                        <FocusChallengePlayerSide
                            state={playerOneState}
                            onAnswer={(count) => handlePlayerAnswer(PlayerSide.LEFT, count)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <FocusChallengePlayerSide
                            state={playerTwoState}
                            onAnswer={(count) => handlePlayerAnswer(PlayerSide.RIGHT, count)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface FocusChallengePlayerSideProps {
    state: PlayerGameState
    onAnswer: (count: number) => void
    playerColor: string
}

function FocusChallengePlayerSide({ state, onAnswer, playerColor }: FocusChallengePlayerSideProps) {
    const [userAnswer, setUserAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [grid, setGrid] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!state.questions[state.currentIndex]) return
        const currentQuestion = state.questions[state.currentIndex] as FocusChallengeQuestion
        const newGrid = FocusChallengeContent.generateGrid(currentQuestion)
        setGrid(newGrid)
        setUserAnswer('')
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [state.currentIndex, state.questions])

    const currentQuestion = state.questions[state.currentIndex] as FocusChallengeQuestion
    if (!currentQuestion) return <div>Loading...</div>

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (showFeedback || !userAnswer) return

        const userCount = parseInt(userAnswer) || 0
        setShowFeedback(true)
        onAnswer(userCount)

        setTimeout(() => {
            setShowFeedback(false)
            setUserAnswer('')
            inputRef.current?.focus()
        }, 1500)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100

    return (
        <div className="space-y-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: playerColor }}
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="text-center">
                    <div className="text-3xl font-black" style={{ color: playerColor }}>
                        {state.correct}/{state.questions.length}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                </div>

                <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">
                        {Math.round((state.correct / (state.currentIndex + 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
            </div>

            <div className="text-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4">
                <div className="text-2xl font-bold mb-2">
                    Count the {currentQuestion.content.targetEmoji}
                </div>
            </div>

            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${currentQuestion.content.gridSize}, 1fr)` }}>
                {grid.map((emoji, i) => (
                    <div key={i} className="text-4xl p-3 bg-gray-100 rounded-lg text-center">
                        {emoji}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Count..."
                    className="flex-1 p-4 text-2xl text-center border-4 rounded-xl touch-target"
                    style={{
                        borderColor: showFeedback
                            ? (parseInt(userAnswer) === currentQuestion.correctAnswer ? '#10B981' : '#EF4444')
                            : playerColor
                    }}
                />
                <button
                    type="submit"
                    disabled={showFeedback || !userAnswer}
                    className="px-8 text-white font-bold rounded-xl touch-target"
                    style={{
                        backgroundColor: showFeedback || !userAnswer ? '#D1D5DB' : playerColor
                    }}
                >
                    Submit
                </button>
            </form>
        </div>
    )
}
