'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { MathEngine, GeneratedProblem, MathConfig } from '@/lib/game-engine/math-engine'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import { GradeBand, GradeMapper } from '@/lib/game-engine/grade-mapper'
import NumericKeypad from '@/components/ui/NumericKeypad'
import { fetchCurriculumTemplates } from '@/lib/curriculum/actions'
import '../../styles/game-animations.css'

interface SpeedMathProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number, skillAssessments?: any[]) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    mode?: SessionMode
    grade?: GradeBand
}

export default function SpeedMath({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD,
    grade = '35'
}: SpeedMathProps) {
    // Game state
    const [questions, setQuestions] = useState<GeneratedProblem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentInput, setCurrentInput] = useState('') // User typed input
    const [showFeedback, setShowFeedback] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [skillAssessments, setSkillAssessments] = useState<any[]>([])

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
    const [comboLevel, setComboLevel] = useState(1)

    const isSubmitting = useRef(false) // Lock
    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    // Initialize game
    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        // Show countdown
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const count = sessionConfig.questionCount
        const generated: GeneratedProblem[] = []

        const gradeConfig = GradeMapper.getConfig(grade)
        const engineDiff = difficulty === 1 ? 'BEGINNER' : difficulty === 2 ? 'INTERMEDIATE' : difficulty === 3 ? 'ADVANCED' : 'CHALLENGE'
        const diffString = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : difficulty === 3 ? 'HARD' : 'CHALLENGE'
        const allowNegatives = gradeConfig.allowNegatives && difficulty >= 3
        const maxRange = gradeConfig.maxNumberRange

        // Fetch curriculum templates from PB
        const templates = await fetchCurriculumTemplates('SPEED_MATH')
        const activeTemplates = templates.filter((t: any) => t.difficulty === diffString)

        for (let i = 0; i < count; i++) {
            let customRange: [number, number] = [1, maxRange]
            let forceOperation: any = undefined

            if (activeTemplates.length > 0) {
                // Randomly select a template to satisfy a CCSS/CBSE standard
                const t = activeTemplates[Math.floor(Math.random() * activeTemplates.length)]
                const params = t.parameters as any
                if (params?.rangeA) customRange = params.rangeA
                if (params?.operation) forceOperation = params.operation
            }

            generated.push(MathEngine.generateProblem({
                difficulty: engineDiff,
                allowNegatives,
                customRange,
                forceOperation
            }))
        }

        setQuestions(generated)
        setCurrentIndex(0)
        setTimeLeft(GradeMapper.scaleTime(sessionConfig.timeLimit || 600, grade))
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

    // Input Handling
    const handleInput = (val: string) => {
        if (showFeedback || !gameStarted) return

        // Prevent multiple negatives or invalid placement
        if (val === '-' && currentInput.includes('-')) return
        if (val === '-' && currentInput.length > 0) return // Negative only at start
        if (currentInput.length >= 6) return // Max length

        setCurrentInput(prev => prev + val)
    }

    const handleDelete = () => {
        if (showFeedback || !gameStarted) return
        setCurrentInput(prev => prev.slice(0, -1))
    }

    const handleClear = () => {
        if (showFeedback || !gameStarted) return
        setCurrentInput('')
    }

    const handleSubmit = () => {
        if (showFeedback || !gameStarted || currentInput === '' || currentInput === '-' || isSubmitting.current) return

        isSubmitting.current = true

        const answer = parseInt(currentInput, 10)
        const now = Date.now()

        const currentQuestion = questions[currentIndex]
        const isCorrect = answer === currentQuestion.answer
        const timeSpent = (now - questionStartTime) / 1000

        // Map operation to basic skill codes
        let skillCode = 'MATH.GENERIC'
        if (currentQuestion.expression.includes('+')) skillCode = 'MATH.ADD.1DIGIT'
        if (currentQuestion.expression.includes('-')) skillCode = 'MATH.SUB.1DIGIT'
        if (currentQuestion.expression.includes('×')) skillCode = 'MATH.MULT.1DIGIT'

        setSkillAssessments(prev => [...prev, { code: skillCode, isCorrect }])

        setShowFeedback(true)
        setTotalTimeSpent(prev => prev + timeSpent)

        if (isCorrect) {
            handleCorrect(currentQuestion, timeSpent)
        } else {
            handleWrong()
        }

        // Move to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setCurrentInput('')
                setShowFeedback(false)
                setQuestionStartTime(Date.now())
                isSubmitting.current = false
            } else {
                endGame()
            }
        }, 1500)
    }

    const handleCorrect = (question: GeneratedProblem, timeSpent: number) => {
        const newStreak = streak + 1
        setStreak(newStreak)
        setCorrectAnswers(prev => prev + 1)

        // Calculate XP
        // Base points dynamic based on complexity (simple approx)
        const basePoints = difficulty * 10

        const xpResult = ScoringEngine.calculateXP({
            baseScore: basePoints,
            accuracy: 1,
            timeSpent,
            expectedTime: 15,
            streak: newStreak,
            hintsUsed: 0,
            mistakes,
            difficulty,
            perfectRound: false
        })

        setScore(prev => prev + xpResult.totalXP)

        const combo = ScoringEngine.getComboLevel(newStreak)
        setComboLevel(combo.level)

        feedbackSystem.current.showCorrectAnimation()
        feedbackSystem.current.showXPPopup(xpResult.totalXP)

        if (newStreak >= 3) {
            feedbackSystem.current.showComboAnimation(combo.multiplier, newStreak)
        }

        toast.success(`${getEncouragingMessage('excellent')} +${xpResult.totalXP} XP`, { icon: '🎯', duration: 1000 })
    }

    const handleWrong = () => {
        setStreak(0)
        setMistakes(prev => prev + 1)
        setComboLevel(1)
        feedbackSystem.current.showWrongAnimation()
        toast.error('Try again! Keep practicing! 💪', { duration: 1500 })
    }

    const endGame = () => {
        setGameStarted(false)
        onGameEnd(score, correctAnswers, questions.length, skillAssessments)
    }

    if (showCountdown || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎮</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Speed Math...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-6 relative overflow-hidden max-w-2xl mx-auto">
            {/* Background gradient based on combo */}
            <div
                className="absolute inset-0 opacity-5 transition-all duration-500"
                style={{
                    background: `linear-gradient(135deg, ${combo.color} 0%, transparent 100%)`
                }}
            />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 mt-4">
                <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                        ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    {streak >= 3 && (
                        <div
                            className="px-3 py-1 rounded-full font-bold text-white text-sm animate-pulse"
                            style={{ backgroundColor: combo.color }}
                        >
                            {streak}x Streak
                        </div>
                    )}
                </div>

                <div className="text-2xl font-bold text-emerald-600">
                    XP {score}
                </div>
            </div>

            {/* Question Display */}
            <div className="text-center mb-8">
                <div className="text-6xl font-black text-gray-800 tracking-wider mb-6 font-mono">
                    {currentQuestion.expression}
                </div>

                {/* Input Display box — readOnly, all input via NumericKeypad */}
                <input
                    type="text"
                    inputMode="none"
                    value={currentInput}
                    readOnly
                    className={`
                        w-full h-20 text-center text-5xl font-mono font-bold rounded-xl border-4 outline-none transition-colors cursor-default select-none
                        ${showFeedback
                            ? parseInt(currentInput) === currentQuestion.answer
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-red-500 bg-red-50 text-red-700'
                            : currentInput ? 'border-blue-400 bg-white text-gray-900' : 'border-gray-200 bg-gray-100 text-gray-400'
                        }
                    `}
                    placeholder="?"
                />

                {/* Feedback Text Overlay */}
                {showFeedback && (
                    <div className={`mt-2 font-bold text-lg ${parseInt(currentInput) === currentQuestion.answer ? 'text-emerald-600' : 'text-red-600'}`}>
                        {parseInt(currentInput) === currentQuestion.answer ? 'Correct!' : `Answer: ${currentQuestion.answer}`}
                    </div>
                )}
            </div>

            {/* Numeric Keypad */}
            <div className="max-w-xs mx-auto">
                <NumericKeypad
                    onInput={handleInput}
                    onDelete={handleDelete}
                    onSubmit={handleSubmit}
                    onClear={handleClear}
                    disabled={showFeedback || !gameStarted}
                />
            </div>

            {/* Footer Stats */}
            <div className="mt-8 flex justify-between text-sm text-gray-500 border-t pt-4">
                <div>Question {currentIndex + 1} / {questions.length}</div>
                <div>Accuracy: {questions.length > 0 ? Math.round((correctAnswers / (currentIndex + 1)) * 100) : 0}%</div>
            </div>
        </div>
    )
}
