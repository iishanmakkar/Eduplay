'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { ScienceQuizContent, ScienceQuestion } from '@/lib/game-engine/content-pools/science-quiz'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import { GradeBand } from '@/lib/game-engine/grade-mapper'
import { fetchCurriculumTemplates } from '@/lib/curriculum/actions'
import '../../styles/game-animations.css'

interface ScienceQuizProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function ScienceQuiz({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    grade = '35',
    mode = SessionMode.STANDARD
}: ScienceQuizProps) {
    // Game state
    const [questions, setQuestions] = useState<ScienceQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
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

        const pool = ScienceQuizContent.generateGradePool(grade || '35')

        // Fetch curriculum templates from PB
        const templates = await fetchCurriculumTemplates('SCIENCE_QUIZ')
        if (templates.length > 0) {
            const allowedTopics = templates.map((t: any) => t.parameters?.topic).filter(Boolean)
            if (allowedTopics.length > 0) {
                // Filter pool by standard
                pool.easy = pool.easy.filter(q => allowedTopics.includes((q as any).content.topic))
                pool.medium = pool.medium.filter(q => allowedTopics.includes((q as any).content.topic))
                pool.hard = pool.hard.filter(q => allowedTopics.includes((q as any).content.topic))
                pool.challenge = pool.challenge.filter(q => allowedTopics.includes((q as any).content.topic))
            }
        }

        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        // Fallback or handle cases where filter was too restrictive
        let finalPool = pool;
        if (finalPool.easy.length === 0 && finalPool.medium.length === 0 && finalPool.hard.length === 0) {
            finalPool = ScienceQuizContent.generateGradePool(grade || '35')
        }
        const sessionQuestions = generator.generateSession(finalPool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as ScienceQuestion[])
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

            toast.success(`${getEncouragingMessage('excellent')} +${xpResult.totalXP} XP`, {
                icon: '🎯',
                duration: 1500
            })
        } else {
            setStreak(0)
            setMistakes(prev => prev + 1)

            feedbackSystem.current.showWrongAnimation()

            // Show explanation if available
            if (sessionConfig.showExplanations && currentQuestion.content.explanation) {
                setShowExplanation(true)
            }

            toast.error('Not quite! Keep learning! 📚', {
                duration: 1500
            })
        }

        // Move to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setSelectedAnswer(null)
                setShowFeedback(false)
                setShowExplanation(false)
                isSubmitting.current = false // Unlock
                setQuestionStartTime(Date.now())
            } else {
                endGame()
            }
        }, showExplanation ? 3000 : 1500)
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
                    <div className="text-6xl mb-4 animate-bounce">🔬</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Science Quiz...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)

    // Topic colors
    const topicColors: Record<string, string> = {
        biology: 'bg-green-100 text-green-700',
        chemistry: 'bg-blue-100 text-blue-700',
        physics: 'bg-purple-100 text-purple-700',
        'earth-science': 'bg-orange-100 text-orange-700'
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
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
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
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6 question-enter relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-600">
                        Question {currentIndex + 1} of {questions.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${topicColors[currentQuestion.content.topic]}`}>
                            {currentQuestion.content.topic.toUpperCase()}
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

                {/* Question Text */}
                <div className="text-2xl font-bold text-gray-900 mb-6">
                    {currentQuestion.content.question}
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={showFeedback}
                            className={`w-full p-4 text-left rounded-xl font-semibold transition-all duration-200 game-button touch-manipulation select-none active:scale-95 ${showFeedback
                                ? index === currentQuestion.correctAnswer
                                    ? 'bg-emerald-500 text-white scale-105'
                                    : index === selectedAnswer
                                        ? 'bg-red-500 text-white animate-wrong-shake'
                                        : 'bg-gray-200 text-gray-400'
                                : 'bg-white border-4 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-900'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Explanation */}
                {showExplanation && currentQuestion.content.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg slide-up">
                        <div className="flex items-start gap-2">
                            <span className="text-2xl">💡</span>
                            <div>
                                <div className="font-bold text-blue-900 mb-1">Did you know?</div>
                                <div className="text-blue-800">{currentQuestion.content.explanation}</div>
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
