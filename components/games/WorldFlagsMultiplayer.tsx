'use client'

/**
 * World Flags - Multiplayer Edition
 * Competitive geography quiz with speed bonuses
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
import { WorldFlagsContent, FlagQuestion } from '@/lib/game-engine/content-pools/world-flags'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import Image from 'next/image'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

export default function WorldFlagsMultiplayer() {
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

        const pool = WorldFlagsContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            20, // 20 flags per player
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

    const handlePlayerAnswer = (side: PlayerSide, answer: string, reactionTime: number) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as FlagQuestion
        const isCorrect = answer === currentQuestion.options[currentQuestion.correctAnswer]

        let points = currentQuestion.points

        // Speed bonus for fast answers (<3s = 2x)
        if (isCorrect && reactionTime < 3000) {
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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="World Flags Race" />
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
                        <WorldFlagsPlayerSide
                            state={playerOneState}
                            onAnswer={(answer, time) => handlePlayerAnswer(PlayerSide.LEFT, answer, time)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <WorldFlagsPlayerSide
                            state={playerTwoState}
                            onAnswer={(answer, time) => handlePlayerAnswer(PlayerSide.RIGHT, answer, time)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface WorldFlagsPlayerSideProps {
    state: PlayerGameState
    onAnswer: (answer: string, reactionTime: number) => void
    playerColor: string
}

function WorldFlagsPlayerSide({ state, onAnswer, playerColor }: WorldFlagsPlayerSideProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const isSubmitting = useRef(false) // Lock

    useEffect(() => {
        setQuestionStartTime(Date.now())
    }, [state.currentIndex])

    const currentQuestion = state.questions[state.currentIndex] as FlagQuestion
    if (!currentQuestion) return <div>Loading...</div>

    const handleAnswer = (answer: string, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (showFeedback || isSubmitting.current) return
        isSubmitting.current = true

        const reactionTime = Date.now() - questionStartTime
        setSelectedAnswer(answer)
        setShowFeedback(true)
        onAnswer(answer, reactionTime)

        setTimeout(() => {
            setSelectedAnswer(null)
            setShowFeedback(false)
            isSubmitting.current = false
        }, 1200)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100
    const combo = ScoringEngine.getComboLevel(state.streak)

    return (
        <div className="space-y-6 select-none touch-none">
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
                    <div className="text-sm text-gray-600">Correct</div>
                </div>

                {state.streak >= 3 && (
                    <div
                        className="px-4 py-2 rounded-full font-bold text-white animate-pulse"
                        style={{ backgroundColor: combo.color }}
                    >
                        🌍 {state.streak}x Streak!
                    </div>
                )}

                <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">
                        ⚡ {combo.multiplier}x
                    </div>
                    <div className="text-sm text-gray-600">Speed</div>
                </div>
            </div>

            {/* Flag Image & Map */}
            <div className="bg-white rounded-xl p-4 shadow-xl">
                <div className="text-xs text-gray-500 mb-2 text-center uppercase tracking-wider font-bold">
                    Question {state.currentIndex + 1}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden border-2 border-gray-100 shadow-inner">
                        <Image
                            src={currentQuestion.content.flagUrl}
                            alt="Flag"
                            fill
                            className="object-cover animate-pop"
                        />
                    </div>

                    {/* Region Map Visualization */}
                    <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200 relative overflow-hidden group">
                        <svg viewBox="0 0 100 100" className="h-16 opacity-30 group-hover:opacity-50 transition-opacity">
                            {currentQuestion.content.region === 'asia' && <path d="M10,10 Q50,0 90,10 T90,90 T10,90 Z" fill="currentColor" className="text-red-500" />}
                            {currentQuestion.content.region === 'europe' && <path d="M20,20 Q40,10 60,20 T80,40 T60,60 T20,40 Z" fill="currentColor" className="text-blue-500" />}
                            {currentQuestion.content.region === 'africa' && <path d="M30,10 Q60,10 70,40 T60,80 T30,80 T20,40 Z" fill="currentColor" className="text-yellow-600" />}
                            {currentQuestion.content.region === 'americas' && <path d="M40,5 Q60,5 60,40 T50,95 T30,80 T20,40 Z" fill="currentColor" className="text-green-600" />}
                            {currentQuestion.content.region === 'oceania' && <path d="M70,70 Q80,65 90,75 T80,90 T70,85 Z" fill="currentColor" className="text-purple-500" />}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded-full">
                                {currentQuestion.content.region}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-lg font-bold text-center text-gray-900 mt-4 leading-tight">
                    Which country is this?
                </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onPointerDown={(e) => handleAnswer(option, e)}
                        disabled={showFeedback}
                        className={`p-4 text-lg font-bold rounded-xl transition-all touch-target select-none ${showFeedback
                            ? option === currentQuestion.options[currentQuestion.correctAnswer]
                                ? 'bg-green-500 text-white scale-105 z-10'
                                : option === selectedAnswer
                                    ? 'bg-red-500 text-white animate-wrong-shake'
                                    : 'bg-gray-100 text-gray-400'
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

            {/* Speed Bonus Indicator */}
            <div className="text-center text-sm text-gray-600">
                💨 Answer in &lt;3s for 2x points!
            </div>
        </div>
    )
}
