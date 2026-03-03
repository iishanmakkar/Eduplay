'use client'

/**
 * Riddle Sprint - Multiplayer Edition
 * Quick riddle solving competition
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
import { RiddleSprintContent } from '@/lib/game-engine/content-pools/riddle-sprint'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

interface RiddleQuestion {
    id: string
    content: { riddle: string }
    options: string[]
    correctAnswer: number
    points: number
    difficulty: string
}

export default function RiddleSprintMultiplayer() {
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

        const pool = RiddleSprintContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            10, // 10 riddles per player
            seed1,
            seed2
        )

        splitScreenEngine.initializeGame(p1Questions, p2Questions, 90) // 90 seconds
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

    const handlePlayerAnswer = (side: PlayerSide, answerIndex: number) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as RiddleQuestion
        const isCorrect = answerIndex === currentQuestion.correctAnswer

        const points = isCorrect ? currentQuestion.points : 0

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
            if (state.streak >= 3) {
                soundManager.playCombo(state.combo)
            }
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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Riddle Sprint Battle" />
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
                        <RiddleSprintPlayerSide
                            state={playerOneState}
                            onAnswer={(index) => handlePlayerAnswer(PlayerSide.LEFT, index)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <RiddleSprintPlayerSide
                            state={playerTwoState}
                            onAnswer={(index) => handlePlayerAnswer(PlayerSide.RIGHT, index)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface RiddleSprintPlayerSideProps {
    state: PlayerGameState
    onAnswer: (answerIndex: number) => void
    playerColor: string
}

function RiddleSprintPlayerSide({ state, onAnswer, playerColor }: RiddleSprintPlayerSideProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)

    const currentQuestion = state.questions[state.currentIndex] as RiddleQuestion
    if (!currentQuestion) return <div>Loading...</div>

    const handleAnswer = (index: number) => {
        if (showFeedback) return

        setSelectedAnswer(index)
        setShowFeedback(true)
        onAnswer(index)

        setTimeout(() => {
            setSelectedAnswer(null)
            setShowFeedback(false)
        }, 1200)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100
    const combo = ScoringEngine.getComboLevel(state.streak)

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
                    <div className="text-sm text-gray-600">Solved</div>
                </div>

                {state.streak >= 3 && (
                    <div
                        className="px-4 py-2 rounded-full font-bold text-white"
                        style={{ backgroundColor: combo.color }}
                    >
                        🎭 {state.streak}x Streak!
                    </div>
                )}

                <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">
                        {Math.round((state.correct / (state.currentIndex + 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
            </div>

            {/* Riddle */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-8 shadow-lg">
                <div className="text-sm text-gray-600 mb-4 text-center">
                    Riddle {state.currentIndex + 1} of {state.questions.length}
                </div>

                <div className="text-2xl font-bold text-center text-gray-900 leading-relaxed">
                    {currentQuestion.content.riddle}
                </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={showFeedback}
                        className={`p-6 text-lg font-bold rounded-xl transition-all touch-target ${showFeedback
                                ? index === currentQuestion.correctAnswer
                                    ? 'bg-green-500 text-white scale-105'
                                    : index === selectedAnswer
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                : 'bg-white border-4 hover:scale-105 text-gray-900'
                            }`}
                        style={{
                            borderColor: showFeedback ? 'transparent' : playerColor
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}
