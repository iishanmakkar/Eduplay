'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { WorldFlagsContent, FlagQuestion } from '@/lib/game-engine/content-pools/world-flags'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import Image from 'next/image'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface WorldFlagsProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
    region?: 'all' | 'asia' | 'europe' | 'africa' | 'americas' | 'oceania'
}

export default function WorldFlags({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD,
    region = 'all'
}: WorldFlagsProps) {
    // Game state
    const [questions, setQuestions] = useState<FlagQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [showGeoFact, setShowGeoFact] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    // Scoring state
    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)

    // Time tracking
    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [totalTimeSpent, setTotalTimeSpent] = useState(0)

    // UI state
    const [showCountdown, setShowCountdown] = useState(true)
    const initializedRef = useRef(false)

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    // Initialize game
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true
            initializeGame()
        }
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = WorldFlagsContent.generateContentPool()

        // Filter by region if specified
        let filteredPool = pool
        if (region !== 'all') {
            filteredPool = {
                easy: pool.easy.filter(q => (q as FlagQuestion).content.region === region),
                medium: pool.medium.filter(q => (q as FlagQuestion).content.region === region),
                hard: pool.hard.filter(q => (q as FlagQuestion).content.region === region),
                challenge: pool.challenge?.filter(q => (q as FlagQuestion).content.region === region)
            }
        }

        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(filteredPool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as FlagQuestion[])
        setTimeLeft(sessionConfig.timeLimit || 600)
        setQuestionStartTime(Date.now())
        setGameStarted(true)
    }

    // Timer
    useEffect(() => {
        if (!gameStarted || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, timeLeft])

    // Safety: Ensure game is marked started if questions exist
    useEffect(() => {
        if (questions.length > 0 && !gameStarted && timeLeft > 0) {
            setGameStarted(true)
        }
    }, [questions.length, gameStarted, timeLeft])

    // Lock state
    const isSubmitting = useRef(false)
    const lastAnswerTime = useRef(0)

    const handleAnswer = (answerIndex: number) => {
        console.log('handleAnswer clicked:', answerIndex, 'isSubmitting:', isSubmitting.current, 'gameStarted:', gameStarted)
        const now = Date.now()
        // Debounce (200ms) and Submission Lock
        if (showFeedback || !gameStarted || isSubmitting.current || (now - lastAnswerTime.current < 200)) {
            console.log('handleAnswer blocked. Feedback:', showFeedback, 'Started:', gameStarted, 'Submitting:', isSubmitting.current)
            return
        }

        isSubmitting.current = true
        lastAnswerTime.current = now

        const currentQuestion = questions[currentIndex]
        const isCorrect = answerIndex === currentQuestion.correctAnswer
        const timeSpent = (now - questionStartTime) / 1000

        setSelectedAnswer(answerIndex)
        setShowFeedback(true)
        setTotalTimeSpent(prev => prev + timeSpent)

        if (isCorrect) {
            const newStreak = streak + 1
            setStreak(newStreak)
            setCorrectAnswers(prev => prev + 1)

            const xpResult = ScoringEngine.calculateXP({
                baseScore: currentQuestion.points,
                accuracy: 1,
                timeSpent,
                expectedTime: currentQuestion.timeLimit || 15,
                streak: newStreak,
                hintsUsed: 0,
                mistakes,
                difficulty,
                perfectRound: false
            })

            setScore(prev => prev + xpResult.totalXP)

            feedbackSystem.current.showCorrectAnimation()
            feedbackSystem.current.showXPPopup(xpResult.totalXP)

            const combo = ScoringEngine.getComboLevel(newStreak)
            if (newStreak >= 3) {
                feedbackSystem.current.showComboAnimation(combo.multiplier, newStreak)
            }

            // Show geo-fact on correct answer
            if (currentQuestion.content.geoFact) {
                setShowGeoFact(true)
            }

            toast.success(`${getEncouragingMessage('excellent')} +${xpResult.totalXP} XP`, {
                icon: '🌍',
                duration: 1500
            })
        } else {
            setStreak(0)
            setMistakes(prev => prev + 1)

            feedbackSystem.current.showWrongAnimation()
            toast.error('Not quite! Keep exploring! 🗺️', {
                duration: 1500
            })
        }

        // Move to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setSelectedAnswer(null)
                setShowFeedback(false)
                setShowGeoFact(false)
                isSubmitting.current = false // Unlock
                setQuestionStartTime(Date.now())
            } else {
                endGame()
            }
        }, showGeoFact ? 3000 : 1500)
    }

    const endGame = () => {
        setGameStarted(false)

        const accuracy = correctAnswers / questions.length
        if (accuracy >= 0.9) {
            feedbackSystem.current.triggerConfetti('perfect')
        } else if (accuracy >= 0.7) {
            feedbackSystem.current.triggerConfetti('amazing')
        }

        onGameEnd(score, correctAnswers, questions.length)
    }

    if (showCountdown || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🌍</div>
                    <div className="text-2xl font-bold text-gray-900">Loading World Flags...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)

    // Region colors
    const regionColors = {
        asia: 'bg-red-100 text-red-700',
        europe: 'bg-blue-100 text-blue-700',
        africa: 'bg-yellow-100 text-yellow-700',
        americas: 'bg-green-100 text-green-700',
        oceania: 'bg-purple-100 text-purple-700'
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Background gradient */}
            <div
                className="absolute inset-0 opacity-5 transition-all duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${combo.color} 0%, transparent 100%)`
                }}
            />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">⏱️</div>
                        <div>
                            <div className={`text-3xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="text-sm text-gray-600">Time Left</div>
                        </div>
                    </div>

                    {/* Combo Indicator */}
                    {streak >= 3 && (
                        <div
                            id="combo-indicator"
                            className="px-4 py-2 rounded-full font-bold text-white combo-active"
                            style={{ backgroundColor: combo.color }}
                        >
                            {streak}x {combo.label}
                        </div>
                    )}
                </div>

                {/* Score */}
                <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6 question-enter">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-600">
                        Question {currentIndex + 1} of {questions.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${regionColors[currentQuestion.content.region]}`}>
                            {currentQuestion.content.region.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                            currentQuestion.difficulty === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                currentQuestion.difficulty === 'HARD' ? 'bg-purple-100 text-purple-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            {currentQuestion.difficulty}
                        </span>
                    </div>
                </div>

                {/* Flag Display & Map */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="relative w-48 h-32 mb-4 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-100 mx-auto">
                            <Image
                                src={currentQuestion.content.flagUrl}
                                alt="Flag"
                                fill
                                className="object-cover animate-pop"
                            />
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                            {currentQuestion.content.question}
                        </div>
                    </div>

                    {/* Region Map Visualization */}
                    <div className="w-48 h-48 bg-gray-100 rounded-2xl p-4 flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden group">
                        <svg viewBox="0 0 1000 500" className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Background styling for water/world is handled by parent container, we draw continents here */}

                            {/* Americas (North & South) */}
                            <path
                                d="M150,50 L250,50 L280,150 L250,250 L280,350 L220,450 L150,400 L120,300 L150,200 L100,100 Z"
                                d-real="M 50 60 L 150 40 L 250 80 L 200 150 L 220 220 L 250 300 L 220 450 L 150 420 L 120 300 L 80 200 L 20 100 Z (Simplified approx)"
                                d-rect="M50,50 h200 v400 h-200 z"
                                d-simplified="M 50,60 Q 150,30 250,60 L 200,180 L 240,450 L 180,480 L 140,200 L 20,80 Z"
                                d-final="M165,45 C165,45 285,35 295,95 C305,155 245,185 255,235 C265,285 295,355 265,445 L195,435 C195,435 155,285 135,235 C115,185 55,105 55,105 C55,105 85,55 165,45 Z"
                                fill="currentColor"
                                className={`transition-colors duration-300 ${currentQuestion.content.region === 'americas' ? 'text-green-500 drop-shadow-md' : 'text-gray-300'}`}
                            />

                            {/* Europe */}
                            <path
                                d-final="M435,55 C435,55 535,45 535,115 C535,115 485,145 465,135 C445,125 415,115 435,55 Z"
                                fill="currentColor"
                                className={`transition-colors duration-300 ${currentQuestion.content.region === 'europe' ? 'text-blue-500 drop-shadow-md' : 'text-gray-300'}`}
                            />

                            {/* Africa */}
                            <path
                                d-final="M435,155 C435,155 535,155 565,205 C595,255 565,395 495,395 C425,395 395,255 425,195 C455,135 435,155 435,155 Z"
                                fill="currentColor"
                                className={`transition-colors duration-300 ${currentQuestion.content.region === 'africa' ? 'text-yellow-500 drop-shadow-md' : 'text-gray-300'}`}
                            />

                            {/* Asia */}
                            <path
                                d-final="M555,55 C555,55 855,55 895,155 C935,255 815,295 735,275 C655,255 555,135 555,55 Z"
                                fill="currentColor"
                                className={`transition-colors duration-300 ${currentQuestion.content.region === 'asia' ? 'text-red-500 drop-shadow-md' : 'text-gray-300'}`}
                            />

                            {/* Oceania */}
                            <path
                                d-final="M755,305 C755,305 895,295 915,365 C935,435 835,455 795,425 C755,395 725,355 755,305 Z"
                                fill="currentColor"
                                className={`transition-colors duration-300 ${currentQuestion.content.region === 'oceania' ? 'text-purple-500 drop-shadow-md' : 'text-gray-300'}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-gray-500 bg-white/90 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                {currentQuestion.content.region} Region
                            </span>
                        </div>
                    </div>
                </div>

                {/* Answer Options - Large Touch Targets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={showFeedback}
                            className={`min-h-[80px] p-6 text-xl font-bold rounded-2xl transition-all duration-200 shadow-sm border-4 touch-manipulation select-none active:scale-95 ${showFeedback
                                ? index === currentQuestion.correctAnswer
                                    ? 'bg-emerald-500 text-white border-emerald-600 scale-105 z-10'
                                    : index === selectedAnswer
                                        ? 'bg-red-500 text-white border-red-600 animate-wrong-shake'
                                        : 'bg-gray-100 text-gray-400 border-gray-200'
                                : 'bg-white border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 text-gray-900'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Geo-Fact */}
                {showGeoFact && currentQuestion.content.geoFact && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg slide-up">
                        <div className="flex items-start gap-2">
                            <span className="text-2xl">🌍</span>
                            <div>
                                <div className="font-bold text-green-900 mb-1">Did you know?</div>
                                <div className="text-green-800">{currentQuestion.content.geoFact}</div>
                                {currentQuestion.content.capital && (
                                    <div className="text-sm text-green-700 mt-1">
                                        Capital: <span className="font-semibold">{currentQuestion.content.capital}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <div>
                        <div className="font-bold text-gray-900">{correctAnswers}</div>
                        <div className="text-gray-600">Correct</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <div className="font-bold text-gray-900">
                            {questions.length > 0 ? Math.round((correctAnswers / (currentIndex + 1)) * 100) : 0}%
                        </div>
                        <div className="text-gray-600">Accuracy</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <div>
                        <div className="font-bold text-gray-900">{streak}</div>
                        <div className="text-gray-600">Streak</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <div className="font-bold text-gray-900">{combo.multiplier}x</div>
                        <div className="text-gray-600">Multiplier</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
