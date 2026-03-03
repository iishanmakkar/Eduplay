'use client'

/**
 * Memory Grid Advanced - Multiplayer Edition
 * Competitive advanced memory challenge
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
import { MemoryGridContent } from '@/lib/game-engine/content-pools/memory-grid-advanced'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

enum GameState {
    SETUP = 'setup',
    COUNTDOWN = 'countdown',
    PLAYING = 'playing',
    VICTORY = 'victory'
}

interface MemoryQuestion {
    id: string
    content: { items: string[] }
    correctAnswer: string[]
    points: number
}

export default function MemoryGridAdvancedMultiplayer() {
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

        const pool = MemoryGridContent.generateContentPool()
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

    const handlePlayerAnswer = (side: PlayerSide, selected: string[]) => {
        const state = splitScreenEngine.getPlayerState(side)
        const currentQuestion = state.questions[state.currentIndex] as MemoryQuestion
        const isCorrect = selected.length === currentQuestion.correctAnswer.length

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
        return <PlayerSetupLobby onStartGame={handleStartGame} gameName="Memory Grid Advanced Battle" />
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
                        <MemoryGridPlayerSide
                            state={playerOneState}
                            onAnswer={(selected) => handlePlayerAnswer(PlayerSide.LEFT, selected)}
                            playerColor={playerOne.color}
                        />
                    }
                    playerTwoContent={
                        <MemoryGridPlayerSide
                            state={playerTwoState}
                            onAnswer={(selected) => handlePlayerAnswer(PlayerSide.RIGHT, selected)}
                            playerColor={playerTwo?.color || '#3B82F6'}
                        />
                    }
                />
            </div>
        )
    }

    return null
}

interface MemoryGridPlayerSideProps {
    state: PlayerGameState
    onAnswer: (selected: string[]) => void
    playerColor: string
}

function MemoryGridPlayerSide({ state, onAnswer, playerColor }: MemoryGridPlayerSideProps) {
    const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
    const [selected, setSelected] = useState<string[]>([])

    const currentQuestion = state.questions[state.currentIndex] as MemoryQuestion | undefined

    useEffect(() => {
        if (!currentQuestion) return

        setPhase('memorize')
        setSelected([])
        const timer = setTimeout(() => setPhase('recall'), 3000)
        return () => clearTimeout(timer)
    }, [state.currentIndex, currentQuestion])

    if (!currentQuestion) return <div>Loading...</div>

    const handleSubmit = () => {
        onAnswer(selected)
        setSelected([])
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
                    <div className="text-2xl font-bold" style={{ color: phase === 'memorize' ? '#F59E0B' : '#10B981' }}>
                        {phase === 'memorize' ? '👁️ MEMORIZE' : '🧠 RECALL'}
                    </div>
                </div>
            </div>

            {phase === 'memorize' && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-8 shadow-lg">
                    <div className="flex gap-4 justify-center text-6xl">
                        {currentQuestion.content.items.map((item, i) => (
                            <div key={i} className="animate-pulse">{item}</div>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'recall' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg">
                        <div className="text-lg mb-2">Selected Items:</div>
                        <div className="text-4xl min-h-[60px]">
                            {selected.length > 0 ? selected.join(' ') : '(none)'}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full p-6 text-white text-xl font-bold rounded-xl touch-target"
                        style={{ backgroundColor: playerColor }}
                    >
                        Submit Answer
                    </button>
                </div>
            )}
        </div>
    )
}
