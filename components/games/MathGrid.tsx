'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { MathGridContent, MathGridQuestion } from '@/lib/game-engine/content-pools/math-grid'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import toast from 'react-hot-toast'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface MathGridProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function MathGrid({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD
}: MathGridProps) {
    // Game State
    const [questions, setQuestions] = useState<MathGridQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answer, setAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    // Lock state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastAnswerTime, setLastAnswerTime] = useState(0)

    // Scoring
    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)

    // Timer
    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [totalTimeSpent, setTotalTimeSpent] = useState(0)

    const [showCountdown, setShowCountdown] = useState(true)
    const initializedRef = useRef(false)
    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true
            initGame()
        }
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = MathGridContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as MathGridQuestion[])
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
    }, [gameStarted])

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const now = Date.now()
        // Debounce and Lock
        if (showFeedback || !gameStarted || !answer || isSubmitting || (now - lastAnswerTime < 200)) return

        setIsSubmitting(true)
        setLastAnswerTime(now)

        const currentQuestion = questions[currentIndex]
        const isCorrect = parseInt(answer) === currentQuestion.correctAnswer
        const timeSpent = (now - questionStartTime) / 1000

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
                expectedTime: currentQuestion.timeLimit || 20,
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

            toast.success(`${getEncouragingMessage('excellent')} +${xpResult.totalXP} XP`, {
                icon: '🎯',
                duration: 1500
            })
        } else {
            setStreak(0)
            setMistakes(prev => prev + 1)
            feedbackSystem.current.showWrongAnimation()
            toast.error(`Wrong! The sum was ${currentQuestion.correctAnswer}`, {
                duration: 2000
            })
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setAnswer('')
                setShowFeedback(false)
                setIsSubmitting(false)
                setQuestionStartTime(Date.now())
            } else {
                endGame()
            }
        }, 2000)
    }

    const endGame = () => {
        setGameStarted(false)
        const accuracy = questions.length > 0 ? correctAnswers / questions.length : 0

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
                    <div className="text-6xl mb-4 animate-bounce">🔢</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Math Grid...</div>
                </div>
            </div>
        )
    }

    const q = questions[currentIndex]
    const combo = ScoringEngine.getComboLevel(streak)
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background gradient */}
            <div
                className="absolute inset-0 opacity-5 transition-all duration-500"
                style={{
                    background: `linear-gradient(135deg, ${combo.color} 0%, transparent 100%)`
                }}
            />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">⏱️</div>
                        <div>
                            <div className={`text-3xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="text-sm text-gray-600">Time Left</div>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            <div className="text-2xl mb-4 font-bold text-gray-800 text-center">Add ALL these numbers:</div>

            <div className={`grid gap-4 mb-6 mx-auto max-w-md transition-all duration-500`}
                style={{
                    gridTemplateColumns: `repeat(${q.content.grid.length}, minmax(0, 1fr))`
                }}>
                {q.content.grid.flat().map((num: number, i: number) => (
                    <div key={i} className="aspect-square flex items-center justify-center text-3xl font-bold bg-blue-50 border-2 border-blue-100 rounded-xl shadow-sm text-blue-900 animate-pop">
                        {num}
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className={`w-full max-w-xs text-4xl p-4 border-4 rounded-xl text-center font-bold tracking-widest min-h-[5rem] transition-colors ${showFeedback
                        ? parseInt(answer) === q.correctAnswer ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'
                        : 'bg-gray-50 border-blue-200 text-gray-900'
                    }`}>
                    {answer || <span className="text-gray-300">?</span>}
                </div>

                <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                        <button
                            key={num}
                            onClick={() => !showFeedback && setAnswer(prev => (prev + num).slice(0, 5))}
                            disabled={showFeedback}
                            className="h-16 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 transition-all shadow-sm disabled:opacity-50"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => !showFeedback && setAnswer('')}
                        disabled={showFeedback}
                        className="h-16 text-xl font-bold bg-red-50 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        C
                    </button>
                    <button
                        onClick={() => !showFeedback && setAnswer(prev => prev.slice(0, -1))}
                        disabled={showFeedback}
                        className="h-16 text-xl font-bold bg-gray-50 text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        ⌫
                    </button>
                </div>

                <button
                    onClick={() => handleSubmit()}
                    disabled={!answer || showFeedback || isSubmitting}
                    className="w-full max-w-xs py-4 bg-blue-500 text-white text-xl font-bold rounded-xl hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
                >
                    {isSubmitting ? 'Checking...' : 'Submit'}
                </button>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-center gap-8 text-sm mt-6">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <div>
                        <div className="font-bold text-gray-900">{correctAnswers}</div>
                        <div className="text-gray-600">Correct</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <div>
                        <div className="font-bold text-gray-900">{streak}</div>
                        <div className="text-gray-600">Streak</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
