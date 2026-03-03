'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { theme } from '@/lib/theme'
import toast from 'react-hot-toast'
import { fetchWithRetry } from '@/lib/fetch-retry'
import { GameMode, GameModeConfig, PlayerSide } from '@/lib/multiplayer/game-modes'
import PlayerSetupLobby from '@/components/multiplayer/PlayerSetupLobby'
import SplitScreenLayout from '@/components/multiplayer/SplitScreenLayout'
import VictoryScreen from '@/components/multiplayer/VictoryScreen'
import { PlayerSetupManager } from '@/lib/multiplayer/player-setup'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ResultSafeGuard, safeScore } from '@/components/games/ResultSafeGuard'
import SpeedMath from '@/components/games/SpeedMath'
import ScienceQuiz from '@/components/games/ScienceQuiz'
import WorldFlags from '@/components/games/WorldFlags'
import MemoryMatch from '@/components/games/MemoryMatch'
import WordScramble from '@/components/games/WordScramble'
import LogicPuzzle from '@/components/games/LogicPuzzle'
import MemoryMatrix from '@/components/games/MemoryMatrix'
import ColorMatch from '@/components/games/ColorMatch'
// Brain Boost Games
import PatternSequence from '@/components/games/PatternSequence'
import MemoryGridAdvanced from '@/components/games/MemoryGridAdvanced'
import FocusChallenge from '@/components/games/FocusChallenge'
import StrategyBuilder from '@/components/games/StrategyBuilder'
import CreativeStory from '@/components/games/CreativeStory'
// Advanced Brain Games
import CodeBreaker from '@/components/games/CodeBreaker'
import MathGridSudoku from '@/components/games/MathGridSudoku'
import VisualRotation from '@/components/games/VisualRotation'
import SequenceBuilder from '@/components/games/SequenceBuilder'
import AnalogiesMaster from '@/components/games/AnalogiesMaster'
import AttentionSwitch from '@/components/games/AttentionSwitch'
import TimePlannerPuzzle from '@/components/games/TimePlannerPuzzle'
import ShapeConstructor from '@/components/games/ShapeConstructor'
import RiddleSprint from '@/components/games/RiddleSprint'
import LogicGridDetective from '@/components/games/LogicGridDetective'
import KidsTypingTutor from '@/components/games/KidsTypingTutor'
import TypingSpeed from '@/components/games/TypingSpeed'
import UniversalGame from '@/components/games/UniversalGame'
import { GAME_INFO as REGISTRY_GAME_INFO } from '@/lib/games/registry'
import BadgeNotification from '@/components/ui/BadgeNotification'
import { BadgeDefinition } from '@/lib/gamification/badges'
import { GradeBand } from '@/lib/game-engine/grade-mapper'


// Use the central registry as source of truth for all 177 games
const GAME_INFO = REGISTRY_GAME_INFO as Record<string, { title: string; emoji: string; description: string }>

export default function PlayGamePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const gameType = (searchParams.get('type') || 'SPEED_MATH') as keyof typeof GAME_INFO
    const grade = (searchParams.get('grade') || '35') as GradeBand

    const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'saving' | 'finished'>('idle')
    const [matchId, setMatchId] = useState<string>('')
    const [isMultiplayer, setIsMultiplayer] = useState(searchParams.get('mode') === 'multiplayer')
    const [showLobby, setShowLobby] = useState(searchParams.get('mode') === 'multiplayer')
    const [gameModeConfig, setGameModeConfig] = useState<GameModeConfig | null>(null)

    // Player scores for split-screen
    const [p1Score, setP1Score] = useState(0)
    const [p2Score, setP2Score] = useState(0)
    const [p1Correct, setP1Correct] = useState(0)
    const [p1Total, setP1Total] = useState(0)
    const [p2Correct, setP2Correct] = useState(0)
    const [p2Total, setP2Total] = useState(0)

    const [p1Finished, setP1Finished] = useState(false)
    const [p2Finished, setP2Finished] = useState(false)

    const [finalScore, setFinalScore] = useState(0)
    const [finalCorrect, setFinalCorrect] = useState(0)
    const [finalTotal, setFinalTotal] = useState(0)

    // Gamification feedback state
    const [unlockedBadges, setUnlockedBadges] = useState<BadgeDefinition[]>([])
    const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number } | undefined>(undefined)
    const [showGamification, setShowGamification] = useState(false)
    const [multiplayerXP, setMultiplayerXP] = useState(0)

    const startTimeRef = useRef<number>(0)
    const mountedRef = useRef(true)

    // Prevent state-update after unmount
    useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

    const gameInfo = GAME_INFO[gameType]

    const startGame = () => {
        // Generate a new unique match ID for this session
        setMatchId(`match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
        setGameStatus('playing')
        setShowLobby(false)
        resetScores()
        startTimeRef.current = Date.now()
    }

    const resetScores = () => {
        setP1Score(0); setP1Correct(0); setP1Total(0)
        setP2Score(0); setP2Correct(0); setP2Total(0)
        setP1Finished(false); setP2Finished(false)
        setFinalScore(0); setFinalCorrect(0); setFinalTotal(0)
    }

    const handleStartMultiplayer = (setupManager: PlayerSetupManager) => {
        const players = setupManager.getPlayers()
        const teams = setupManager.getTeams()

        setGameModeConfig({
            mode: setupManager.getMode(),
            playerOne: players.playerOne,
            playerTwo: players.playerTwo || undefined,
            teamA: teams.teamA || undefined,
            teamB: teams.teamB || undefined,
            settings: {
                enableComebackBonus: true,
                enableSpeedBonus: true,
                enableAccuracyBonus: true,
                smartboardMode: false,
                touchOptimized: true,
                soundEffects: true,
                showCompetitionBar: true,
                autoSwitchSides: false
            }
        })

        startGame()
    }

    // Multiplayer Finish Guard
    useEffect(() => {
        if (gameStatus === 'playing' && gameModeConfig && gameModeConfig.mode !== GameMode.SOLO) {
            if (p1Finished && p2Finished) {
                handleMultiplayerGameEnd()
            }
        }
    }, [p1Finished, p2Finished, gameStatus, gameModeConfig])

    const handleMultiplayerGameEnd = async () => {
        setGameStatus('saving')

        // Determine winner locally for saving
        const p1Win = p1Score > p2Score
        const p2Win = p2Score > p1Score
        // Tie if equal

        const participantsPayload = [
            {
                name: gameModeConfig!.playerOne.name,
                avatar: gameModeConfig!.playerOne.avatar,
                side: 'left',
                score: p1Score,
                accuracy: p1Total > 0 ? p1Correct / p1Total : 0,
                isWinner: p1Win || (!p1Win && !p2Win), // Tie = both winners? Or neither? Let's say winner=false for ties or handle in UI. DB isWinner boolean.
                teamName: gameModeConfig!.mode === GameMode.TEAM_VS_TEAM ? 'Team A' : undefined
            },
            {
                name: gameModeConfig!.playerTwo?.name || 'Player 2',
                avatar: gameModeConfig!.playerTwo?.avatar,
                side: 'right',
                score: p2Score,
                accuracy: p2Total > 0 ? p2Correct / p2Total : 0,
                isWinner: p2Win || (!p1Win && !p2Win),
                teamName: gameModeConfig!.mode === GameMode.TEAM_VS_TEAM ? 'Team B' : undefined
            }
        ]

        // Fix logic: Tie shouldn't mark both as winner in strict sense, but for "isWinner" field... 
        // Let's stick to true only if score > other. Tie = false for both? 
        // Actually, let's allow false for both in tie.
        participantsPayload[0].isWinner = p1Score > p2Score
        participantsPayload[1].isWinner = p2Score > p1Score

        try {
            const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

            const response = await fetchWithRetry('/api/multiplayer/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: matchId, // Idempotency key
                    gameType,
                    mode: gameModeConfig!.mode,
                    duration,
                    participants: participantsPayload
                })
            })

            const data = await response.json()
            if (data.success && data.gamification) {
                const gResult = data.gamification
                if (gResult.unlockedBadges?.length > 0 || gResult.levelUp) {
                    setUnlockedBadges(gResult.newlyUnlockedBadges || [])
                    if (gResult.levelUp) {
                        setLevelUpData({ oldLevel: gResult.newLevel - 1, newLevel: gResult.newLevel })
                    }
                    setShowGamification(true)
                }
                setMultiplayerXP(gResult.xpEarned)
                toast.success(`Multiplayer match saved! +${gResult.xpEarned} XP`)
            }
        } catch (e) {
            console.error('Failed to save multiplayer match', e)
        }

        setGameStatus('finished')
    }

    const handleGameEnd = async (score: number, correctAnswers: number, totalQuestions: number, skillAssessments?: any[]) => {
        // Atomic Guard: Prevent double-saves or triggers from non-playing states
        if (gameStatus !== 'playing') return

        setGameStatus('saving')
        const safeS = safeScore(score)
        const safeC = safeScore(correctAnswers)
        const safeT = safeScore(totalQuestions) || 1
        if (mountedRef.current) {
            setFinalScore(safeS)
            setFinalCorrect(safeC)
            setFinalTotal(safeT)
        }

        const accuracy = safeC / safeT
        const xpEarned = Math.floor(safeS * 0.1 + accuracy * 100)

        // Optimistic update for UI
        if (mountedRef.current) setGameStatus('finished')

        try {
            const response = await fetchWithRetry('/api/games/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    gameType,
                    score: safeS,
                    accuracy,
                    timeSpent: 60,
                    xpEarned,
                    skillAssessments
                }),
            })

            const data = await response.json()
            if (data.success && mountedRef.current) {
                if (data.unlockedBadges?.length > 0 || data.levelUp) {
                    setUnlockedBadges(data.unlockedBadges || [])
                    if (data.levelUp) {
                        setLevelUpData({ oldLevel: data.newLevel - 1, newLevel: data.newLevel })
                    }
                    setShowGamification(true)
                }
                toast.success(`Game saved! +${data.xpEarned} XP`)
            }
        } catch (error) {
            console.error('Failed to save game:', error)
            toast.error('Could not save result (Offline mode)')
        }
    }

    const handleBrainBoostGameEnd = async (
        score: number,
        accuracy: number,
        timeSpent: number,
        difficulty: string,
        reactionTime?: number,
        hintsUsed?: number,
        storyContent?: string
    ) => {
        // Atomic Guard
        if (gameStatus !== 'playing') return

        setGameStatus('saving')
        setFinalScore(score)
        setFinalCorrect(Math.round(accuracy))
        setFinalTotal(100)

        const xpEarned = Math.floor(score * 0.1 + accuracy)

        // Optimistic update
        setGameStatus('finished')

        try {
            const response = await fetchWithRetry('/api/games/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    gameType,
                    score,
                    accuracy: accuracy / 100,
                    timeSpent,
                    xpEarned,
                    difficulty,
                    reactionTime,
                    hintsUsed,
                    storyContent,
                }),
            })

            const data = await response.json()
            if (data.success) {
                if (data.unlockedBadges?.length > 0 || data.levelUp) {
                    setUnlockedBadges(data.unlockedBadges || [])
                    if (data.levelUp) {
                        setLevelUpData({ oldLevel: data.newLevel - 1, newLevel: data.newLevel })
                    }
                    setShowGamification(true)
                }
                toast.success(`Game saved! +${data.xpEarned} XP`)
            }
        } catch (error) {
            console.error('Failed to save game:', error)
        }
    }

    if (showLobby) {
        return (
            <PlayerSetupLobby
                gameName={gameInfo.title}
                onStartGame={handleStartMultiplayer}
            />
        )
    }

    const renderGame = (playerSide?: PlayerSide) => {
        // Robust handler that can deal with different argument counts and types
        const handleEnd = (...args: any[]) => {
            let score = 0;
            let correct = 0;
            let total = 0;

            // Logically determine parameters based on common patterns
            if (args.length >= 3) {
                // Standard: (score, correct, total)
                score = args[0];
                correct = args[1];
                total = args[2];
            } else if (args.length === 2) {
                // Pattern: (score, correct)
                score = args[0];
                correct = args[1];
                total = 100; // Fallback
            } else if (args.length === 1) {
                // Pattern: (score)
                score = args[0];
                correct = score;
                total = 100;
            }

            if (playerSide === PlayerSide.RIGHT) {
                setP2Score(score);
                setP2Correct(correct);
                setP2Total(total);
                if (gameModeConfig?.mode !== GameMode.SOLO) setP2Finished(true)
            } else {
                setP1Score(score);
                setP1Correct(correct);
                setP1Total(total);
                if (gameModeConfig?.mode !== GameMode.SOLO) setP1Finished(true)
            }

            // Only trigger single-player end immediately
            if (!gameModeConfig || gameModeConfig.mode === GameMode.SOLO) {
                handleGameEnd(score, correct, total);
            }
        };

        return (
            <>
                {gameType === 'SPEED_MATH' && <SpeedMath onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'SCIENCE_QUIZ' && <ScienceQuiz onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'WORLD_FLAGS' && <WorldFlags onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'MEMORY_MATCH' && <MemoryMatch onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'WORD_SCRAMBLE' && <WordScramble onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'MEMORY_MATRIX' && <MemoryMatrix onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'COLOR_MATCH' && <ColorMatch onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'LOGIC_PUZZLE' && <LogicPuzzle onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'PATTERN_SEQUENCE' && <PatternSequence onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'MEMORY_GRID_ADV' && <MemoryGridAdvanced onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'FOCUS_REACTION' && <FocusChallenge onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'MINI_STRATEGY' && <StrategyBuilder onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'CREATIVE_THINKING' && <CreativeStory onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'CODE_BREAKER' && <CodeBreaker onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'MATH_GRID' && <MathGridSudoku onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'VISUAL_ROTATION' && <VisualRotation onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'SEQUENCE_BUILDER' && <SequenceBuilder onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'ANALOGY_GAME' && <AnalogiesMaster onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'ATTENTION_SWITCH' && <AttentionSwitch onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'TIME_PLANNER' && <TimePlannerPuzzle onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'SHAPE_CONSTRUCTOR' && <ShapeConstructor onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'RIDDLE_SPRINT' && <RiddleSprint onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'LOGIC_GRID' && <LogicGridDetective onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'KIDS_TYPING' && <KidsTypingTutor onGameEnd={handleEnd} grade={grade} />}
                {gameType === 'TYPING_SPEED' && <TypingSpeed onGameEnd={handleEnd} grade={grade} />}
                {/* All 152 new games — rendered by UniversalGame engine */}
                {!['SPEED_MATH', 'SCIENCE_QUIZ', 'WORLD_FLAGS', 'MEMORY_MATCH', 'WORD_SCRAMBLE',
                    'MEMORY_MATRIX', 'COLOR_MATCH', 'LOGIC_PUZZLE', 'PATTERN_SEQUENCE', 'MEMORY_GRID_ADV',
                    'FOCUS_REACTION', 'MINI_STRATEGY', 'CREATIVE_THINKING', 'CODE_BREAKER', 'MATH_GRID',
                    'VISUAL_ROTATION', 'SEQUENCE_BUILDER', 'ANALOGY_GAME', 'ATTENTION_SWITCH', 'TIME_PLANNER',
                    'SHAPE_CONSTRUCTOR', 'RIDDLE_SPRINT', 'LOGIC_GRID', 'KIDS_TYPING', 'TYPING_SPEED'
                ].includes(gameType) && (
                        <UniversalGame
                            gameKey={gameType}
                            onGameEnd={(score, correct, total) => handleEnd(score, correct / total, 60, '2', undefined, undefined, undefined)}
                            grade={grade}
                        />
                    )}
            </>
        )
    }

    return (
        <div
            className={`${theme.page} flex items-center justify-center ${gameModeConfig?.mode === GameMode.ONE_V_ONE ? '' : 'px-4'}`}
            data-cognitive-band={grade}
        >
            <div className={`w-full ${gameModeConfig?.mode === GameMode.ONE_V_ONE ? 'max-w-none' : 'max-w-2xl'}`}>
                {gameStatus === 'idle' && (
                    <div className={theme.card + " p-12 text-center"}>
                        <div className="text-7xl mb-6">{gameInfo.emoji}</div>
                        <h1 className={`text-4xl font-display font-bold ${theme.textPrimary} mb-4`}>
                            {gameInfo.title}
                        </h1>
                        <p className={`text-lg ${theme.textSecondary} mb-8`}>
                            {gameInfo.description}
                        </p>
                        <div className="flex flex-col gap-4 max-w-xs mx-auto">
                            <button
                                onClick={startGame}
                                className="w-full px-8 py-4 bg-emerald text-white text-lg font-semibold rounded-xl hover:bg-emerald-dark transition shadow-lg active:scale-95 transform"
                            >
                                Solo Play →
                            </button>
                            <button
                                onClick={() => setShowLobby(true)}
                                className="w-full px-8 py-4 bg-purple-600 text-white text-lg font-semibold rounded-xl hover:bg-purple-700 transition shadow-lg active:scale-95 transform"
                            >
                                ⚔️ Compete 1v1
                            </button>
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <Link href="/games" className="text-sm text-mist dark:text-fog hover:text-ink dark:hover:text-white transition">
                                ← Choose different game
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                )}

                {gameStatus === 'playing' && (
                    <div className="relative">
                        {gameModeConfig?.mode === GameMode.ONE_V_ONE ? (
                            <SplitScreenLayout
                                playerOneName={gameModeConfig.playerOne.name}
                                playerTwoName={gameModeConfig.playerTwo?.name || 'Player 2'}
                                playerOneColor={gameModeConfig.playerOne.color}
                                playerTwoColor={gameModeConfig.playerTwo?.color || '#3b82f6'}
                                playerOneAvatar={gameModeConfig.playerOne.avatar}
                                playerTwoAvatar={gameModeConfig.playerTwo?.avatar || '🐯'}
                                playerOneScore={p1Score}
                                playerTwoScore={p2Score}
                                playerOneContent={renderGame(PlayerSide.LEFT)}
                                playerTwoContent={renderGame(PlayerSide.RIGHT)}
                            />
                        ) : (
                            <>
                                {/* Game Controls Header */}
                                <div className="absolute -top-16 left-0 right-0 flex justify-between items-center px-4">
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to quit? Progress will be lost.')) {
                                                setGameStatus('idle')
                                                router.push('/games')
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-ink dark:text-white font-semibold rounded-lg backdrop-blur-sm transition text-sm border border-white/10"
                                    >
                                        <span>⛔</span> Quit Game
                                    </button>
                                    <div className="text-ink/50 dark:text-white/30 text-xs font-mono">Playing: {gameInfo.title}</div>
                                    <ThemeToggle />
                                </div>
                                {renderGame(PlayerSide.LEFT)}
                            </>
                        )}
                    </div>
                )}

                {gameStatus === 'finished' && (
                    <ResultSafeGuard
                        gameName={gameInfo?.title}
                        fallbackSummary={{ score: finalScore, correctAnswers: finalCorrect, totalQuestions: finalTotal, gameName: gameInfo?.title }}
                    >
                        <div className={theme.card + " p-12 text-center max-w-2xl mx-auto"}>
                            {gameModeConfig?.mode === GameMode.ONE_V_ONE ? (
                                <VictoryScreen
                                    winner={p1Score > p2Score ? PlayerSide.LEFT : p2Score > p1Score ? PlayerSide.RIGHT : 'tie'}
                                    playerOneName={gameModeConfig.playerOne.name}
                                    playerTwoName={gameModeConfig.playerTwo?.name || 'Player 2'}
                                    playerOneAvatar={gameModeConfig.playerOne.avatar}
                                    playerTwoAvatar={gameModeConfig.playerTwo?.avatar}
                                    playerOneScore={p1Score}
                                    playerTwoScore={p2Score}
                                    playerOneAccuracy={p1Total > 0 ? (p1Correct / p1Total) * 100 : 0}
                                    playerTwoAccuracy={p2Total > 0 ? (p2Correct / p2Total) * 100 : 0}
                                    xpEarned={multiplayerXP}
                                    onPlayAgain={() => {
                                        setP1Score(0); setP2Score(0);
                                        setP1Correct(0); setP2Correct(0);
                                        setP1Total(0); setP2Total(0);
                                        startGame();
                                    }}
                                    onSwitchSides={() => {
                                        if (gameModeConfig && gameModeConfig.playerTwo) {
                                            setGameModeConfig({
                                                ...gameModeConfig,
                                                playerOne: gameModeConfig.playerTwo,
                                                playerTwo: gameModeConfig.playerOne
                                            })
                                            setP1Score(0); setP2Score(0);
                                            setP1Correct(0); setP2Correct(0);
                                            setP1Total(0); setP2Total(0);
                                            toast.success('Switched sides!')
                                            startGame()
                                        }
                                    }}
                                    onNewPlayers={() => setShowLobby(true)}
                                    onBackToMenu={() => router.push('/games')}
                                />
                            ) : (
                                <>
                                    <div className="text-7xl mb-6">🎯</div>
                                    <h2 className={`text-4xl font-display font-bold ${theme.textPrimary} mb-4`}>
                                        Session Complete
                                    </h2>
                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 transition-colors border border-slate-200 dark:border-slate-700">
                                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{safeScore(finalScore).toLocaleString()}</div>
                                            <div className={theme.textSecondary + " text-sm"}>Final Score</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 transition-colors border border-slate-200 dark:border-slate-700">
                                            <div className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-1">{safeScore(finalCorrect)}/{Math.max(1, safeScore(finalTotal))}</div>
                                            <div className={theme.textSecondary + " text-sm"}>Correct</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 transition-colors border border-slate-200 dark:border-slate-700">
                                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                                                {Math.round((safeScore(finalCorrect) / Math.max(1, safeScore(finalTotal))) * 100)}%
                                            </div>
                                            <div className={theme.textSecondary + " text-sm"}>Accuracy</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={startGame}
                                            className="flex-1 py-4 bg-emerald text-white font-semibold rounded-xl hover:bg-emerald-dark transition shadow-lg"
                                        >
                                            Play Again
                                        </button>
                                        <Link
                                            href="/dashboard"
                                            className="flex-1 py-4 bg-ink text-white font-semibold rounded-xl hover:bg-ink-2 transition text-center shadow-lg"
                                        >
                                            Back to Dashboard
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </ResultSafeGuard>
                )}

                {showGamification && (
                    <BadgeNotification
                        badges={unlockedBadges}
                        levelUp={levelUpData}
                        onComplete={() => {
                            setShowGamification(false)
                            setUnlockedBadges([])
                            setLevelUpData(undefined)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
