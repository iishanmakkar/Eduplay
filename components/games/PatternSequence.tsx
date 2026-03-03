'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { PatternSequenceContent, PatternSequenceQuestion } from '@/lib/game-engine/content-pools/pattern-sequence'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface PatternSequenceProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function PatternSequence({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD
}: PatternSequenceProps) {
    const [questions, setQuestions] = useState<PatternSequenceQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)

    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())

    const [showCountdown, setShowCountdown] = useState(true)

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = PatternSequenceContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(Number(seed))
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as PatternSequenceQuestion[])
        setTimeLeft(sessionConfig.timeLimit || 600)
        setQuestionStartTime(Date.now())
        setGameStarted(true)
    }

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

    // Lock state
    const isSubmitting = useRef(false) // Ref Lock
    const lastAnswerTime = useRef(0)

    const handleAnswer = (answerIndex: number, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const now = Date.now()
        // Debounce (200ms) and Submission Lock
        if (showFeedback || !gameStarted || isSubmitting.current || (now - lastAnswerTime.current < 200)) return

        isSubmitting.current = true
        lastAnswerTime.current = now

        const currentQuestion = questions[currentIndex]
        const isCorrect = answerIndex === currentQuestion.correctAnswer
        const timeSpent = (now - questionStartTime) / 1000

        setSelectedAnswer(answerIndex)
        setShowFeedback(true)

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
            toast.error('Not quite! Look for the pattern.', {
                duration: 1500
            })
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setSelectedAnswer(null)
                setShowFeedback(false)
                isSubmitting.current = false // Unlock
                setQuestionStartTime(Date.now())
            } else {
                endGame()
            }
        }, 1500)
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
                    <div className="text-6xl mb-4 animate-bounce">🎯</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Pattern Sequence...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

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

                <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6 question-enter">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-600">
                        Pattern {currentIndex + 1} of {questions.length}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                        currentQuestion.difficulty === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                            currentQuestion.difficulty === 'HARD' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                        }`}>
                        {currentQuestion.difficulty}
                    </span>
                </div>

                <div className="text-center mb-6">
                    <div className="text-lg font-bold text-gray-900 mb-4">
                        {currentQuestion.content.description}
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        {currentQuestion.content.sequence.map((item, index) => (
                            <div
                                key={index}
                                className={`text-5xl p-3 rounded-lg ${item === '?' ? 'bg-yellow-100 border-4 border-yellow-500 animate-pulse' : 'bg-white'
                                    }`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onPointerDown={(e) => handleAnswer(index, e)}
                            disabled={showFeedback}
                            className={`p-6 text-5xl rounded-xl transition-all duration-200 game-button touch-none select-none active:scale-95 ${showFeedback
                                ? index === currentQuestion.correctAnswer
                                    ? 'bg-emerald-500 scale-105'
                                    : index === selectedAnswer
                                        ? 'bg-red-500 animate-wrong-shake'
                                        : 'bg-gray-200'
                                : 'bg-white border-4 border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

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
            </div>
        </div>
    )
}
