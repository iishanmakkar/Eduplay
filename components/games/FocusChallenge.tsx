'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { FocusChallengeContent, FocusChallengeQuestion } from '@/lib/game-engine/content-pools/focus-challenge'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface FocusChallengeProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function FocusChallenge({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.QUICK
}: FocusChallengeProps) {
    const [questions, setQuestions] = useState<FocusChallengeQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [grid, setGrid] = useState<string[]>([])
    const [userAnswer, setUserAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)

    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)

    const [showCountdown, setShowCountdown] = useState(true)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const inputRef = useRef<HTMLInputElement>(null)
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = FocusChallengeContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as FocusChallengeQuestion[])
        loadQuestion(sessionQuestions[0] as FocusChallengeQuestion)
        setGameStarted(true)

        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const loadQuestion = (question: FocusChallengeQuestion) => {
        const newGrid = FocusChallengeContent.generateGrid(question)
        setGrid(newGrid)
        setTimeLeft(question.timeLimit || 10)
        setQuestionStartTime(Date.now())
    }

    useEffect(() => {
        if (!gameStarted || timeLeft <= 0 || showFeedback) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, timeLeft, showFeedback])

    const isSubmitting = useRef(false) // Lock

    // ... (omitting lines between)

    const handleSubmit = () => {
        if (showFeedback || isSubmitting.current) return
        isSubmitting.current = true

        const currentQuestion = questions[currentIndex]
        const userCount = parseInt(userAnswer) || 0
        const isCorrect = userCount === currentQuestion.correctAnswer
        const timeSpent = (Date.now() - questionStartTime) / 1000

        setShowFeedback(true)

        if (isCorrect) {
            // ... (keep score logic)
            const newStreak = streak + 1
            setStreak(newStreak)
            setCorrectAnswers(prev => prev + 1)

            const speedBonus = timeSpent < (currentQuestion.timeLimit || 10) / 2 ? 1.5 : 1

            const xpResult = ScoringEngine.calculateXP({
                baseScore: currentQuestion.points * speedBonus,
                accuracy: 1,
                timeSpent,
                expectedTime: currentQuestion.timeLimit || 10,
                streak: newStreak,
                hintsUsed: 0,
                mistakes: 0,
                difficulty,
                perfectRound: false
            })

            setScore(prev => prev + xpResult.totalXP)
            feedbackSystem.current.showCorrectAnimation()
            feedbackSystem.current.showXPPopup(xpResult.totalXP)

            toast.success(`Perfect focus! +${xpResult.totalXP} XP`, { icon: '🎯', duration: 1000 })
        } else {
            setStreak(0)
            feedbackSystem.current.showWrongAnimation()
            toast.error(`Wrong! It was ${currentQuestion.correctAnswer}`, { duration: 1500 })
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setUserAnswer('')
                setShowFeedback(false)
                loadQuestion(questions[currentIndex + 1])
                inputRef.current?.focus()
                isSubmitting.current = false
            } else {
                endGame()
            }
        }, 1500)
    }

    const endGame = () => {
        setGameStarted(false)
        const accuracy = correctAnswers / questions.length
        if (accuracy >= 0.9) feedbackSystem.current.triggerConfetti('perfect')
        onGameEnd(score, correctAnswers, questions.length)
    }

    if (showCountdown || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎯</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Focus Challenge...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex justify-between mb-6 mt-2">
                <div className="flex gap-4">
                    <div className="text-3xl font-bold text-gray-900">
                        {timeLeft}s
                    </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {score}
                </div>
            </div>

            <div className="text-center mb-4">
                <div className="text-2xl font-bold mb-2">
                    Count the {currentQuestion.content.targetEmoji}
                </div>
            </div>

            <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${currentQuestion.content.gridSize}, 1fr)` }}>
                {grid.map((emoji, i) => (
                    <div key={i} className="text-4xl p-3 bg-gray-100 rounded-lg text-center">
                        {emoji}
                    </div>
                ))}
            </div>

            <div className="flex gap-3 mb-6">
                <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Count..."
                    className="flex-1 p-4 text-3xl text-center border-4 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition"
                />
            </div>
            {/* Numeric Keypad for Touch */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
                    <button
                        key={num}
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault()
                            if (num === 'C') setUserAnswer('')
                            else if (num === 'OK') handleSubmit()
                            else setUserAnswer(prev => prev + num)
                        }}
                        disabled={showFeedback || isSubmitting.current}
                        className="h-16 text-2xl font-bold bg-gray-50 hover:bg-gray-100 rounded-xl transition active:scale-95 disabled:opacity-50 touch-none select-none"
                    >
                        {num}
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={showFeedback || !userAnswer || isSubmitting.current}
                className="w-full py-5 bg-orange-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-orange-600 transition active:scale-95 disabled:opacity-50"
            >
                Submit Count →
            </button>

            <div className="flex justify-center gap-8 mt-6 text-sm">
                <div className="text-center">
                    <div className="font-bold text-2xl">{correctAnswers}</div>
                    <div className="text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                    <div className="font-bold text-2xl">{streak}</div>
                    <div className="text-gray-600">Streak</div>
                </div>
            </div>
        </div >
    )
}
