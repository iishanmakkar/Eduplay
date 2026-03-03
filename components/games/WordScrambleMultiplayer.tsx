'use client'

/**
 * Word Scramble - Multiplayer Edition
 * Competitive word unscrambling race
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
import { WordScrambleContent, WordScrambleQuestion } from '@/lib/game-engine/content-pools/word-scramble'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

export default function WordScrambleMultiplayer() {
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

        const pool = WordScrambleContent.generateContentPool()
        const seed1 = Date.now()
        const seed2 = Date.now() + 1000

        const { playerOne: p1Questions, playerTwo: p2Questions } = splitScreenEngine.generateIndependentQuestions(
            pool,
            10, // 10 words per player
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

    const handlePlayerAnswer = (side: PlayerSide, answer: string) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as WordScrambleQuestion
        const isCorrect = answer.toLowerCase().trim() === currentQuestion.content.word.toLowerCase()

        const basePoints = currentQuestion.points
        const points = isCorrect ? basePoints : 0

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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Word Scramble Race" />
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
                        <WordScramblePlayerSide
                            state={playerOneState}
                            onAnswer={(answer) => handlePlayerAnswer(PlayerSide.LEFT, answer)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <WordScramblePlayerSide
                            state={playerTwoState}
                            onAnswer={(answer) => handlePlayerAnswer(PlayerSide.RIGHT, answer)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface WordScramblePlayerSideProps {
    state: PlayerGameState
    onAnswer: (answer: string) => void
    playerColor: string
}

function WordScramblePlayerSide({ state, onAnswer, playerColor }: WordScramblePlayerSideProps) {
    const [userInput, setUserInput] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [state.currentIndex])

    const currentQuestion = state.questions[state.currentIndex] as WordScrambleQuestion
    if (!currentQuestion) return <div>Loading...</div>

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (showFeedback || !userInput.trim()) return

        setShowFeedback(true)
        onAnswer(userInput)

        setTimeout(() => {
            setUserInput('')
            setShowFeedback(false)
            inputRef.current?.focus()
        }, 1200)
    }

    const progress = ((state.currentIndex + 1) / state.questions.length) * 100
    const combo = ScoringEngine.getComboLevel(state.streak)
    const isCorrect = userInput.toLowerCase().trim() === currentQuestion.content.word.toLowerCase()

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
                    <div className="text-sm text-gray-600">Correct</div>
                </div>

                {state.streak >= 3 && (
                    <div
                        className="px-4 py-2 rounded-full font-bold text-white"
                        style={{ backgroundColor: combo.color }}
                    >
                        📝 {state.streak}x Streak!
                    </div>
                )}

                <div className="text-center">
                    <div className="text-3xl font-black text-gray-900">
                        {Math.round((state.correct / (state.currentIndex + 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
            </div>

            {/* Question */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-gray-600 mb-2 text-center">
                    Question {state.currentIndex + 1} of {state.questions.length}
                </div>

                <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-2">Unscramble this word:</div>
                    <div className="text-6xl font-black text-gray-900 tracking-widest mb-2">
                        {currentQuestion.content.scrambled.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                        {currentQuestion.content.word.length} letters
                    </div>
                </div>

                {currentQuestion.content.category && (
                    <div className="text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            {currentQuestion.content.category.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Type your answer..."
                    className={`w-full p-6 text-3xl text-center font-bold rounded-xl border-4 transition-all touch-target ${showFeedback
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
                    Submit Answer
                </button>
            </form>

            {/* Correct Answer (if wrong) */}
            {showFeedback && !isCorrect && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="text-sm text-blue-700 mb-1">The correct word was:</div>
                    <div className="text-3xl font-bold text-blue-900">
                        {currentQuestion.content.word.toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    )
}
