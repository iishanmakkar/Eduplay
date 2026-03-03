'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { ColorMatchContent, ColorMatchQuestion } from '@/lib/game-engine/content-pools/color-match'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface ColorMatchProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function ColorMatch({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.QUICK // Color match is fast-paced
}: ColorMatchProps) {
    // Game state
    const [questions, setQuestions] = useState<ColorMatchQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [gameStarted, setGameStarted] = useState(false)

    // Scoring state
    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)
    const [reactionTimes, setReactionTimes] = useState<number[]>([])

    // Time tracking
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())

    // UI state
    const [showCountdown, setShowCountdown] = useState(true)
    const [showFeedback, setShowFeedback] = useState(false)

    const isSubmitting = useRef(false) // Lock
    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    // Initialize game
    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = ColorMatchContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as ColorMatchQuestion[])
        setQuestionStartTime(Date.now())
        setGameStarted(true)
    }

    const handleAnswer = (userAnswer: boolean, e?: React.PointerEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (showFeedback || !gameStarted || isSubmitting.current) return
        isSubmitting.current = true

        const currentQuestion = questions[currentIndex]
        const isCorrect = userAnswer === currentQuestion.content.isMatch
        const reactionTime = (Date.now() - questionStartTime) / 1000

        setShowFeedback(true)
        setReactionTimes(prev => [...prev, reactionTime])

        if (isCorrect) {
            const newStreak = streak + 1
            setStreak(newStreak)
            setCorrectAnswers(prev => prev + 1)

            // Bonus for fast reactions
            const speedBonus = reactionTime < 1 ? 2 : reactionTime < 1.5 ? 1.5 : 1

            const xpResult = ScoringEngine.calculateXP({
                baseScore: currentQuestion.points * speedBonus,
                accuracy: 1,
                timeSpent: reactionTime,
                expectedTime: 2,
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

            if (reactionTime < 1) {
                toast.success(`${getEncouragingMessage('lightning')} ⚡ +${xpResult.totalXP} XP`, {
                    duration: 800
                })
            } else {
                toast.success(`Correct! +${xpResult.totalXP} XP`, {
                    icon: '✅',
                    duration: 800
                })
            }
        } else {
            setStreak(0)
            setMistakes(prev => prev + 1)

            feedbackSystem.current.showWrongAnimation()
            toast.error('Wrong!', {
                duration: 800
            })
        }

        // Move to next question quickly
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setShowFeedback(false)
                setQuestionStartTime(Date.now())
                isSubmitting.current = false
            } else {
                endGame()
            }
        }, 800)
    }

    const endGame = () => {
        setGameStarted(false)

        const accuracy = correctAnswers / questions.length
        const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length

        if (accuracy >= 0.9 && avgReactionTime < 1.5) {
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
                    <div className="text-6xl mb-4 animate-bounce">🎨</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Color Match...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)
    const avgReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                    {/* Question Counter */}
                    <div className="px-4 py-2 rounded-full font-bold bg-pink-500 text-white">
                        {currentIndex + 1}/{questions.length}
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
                    <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                        {score}
                    </div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            {/* Instructions */}
            <div className="text-center mb-6">
                <div className="text-lg font-bold text-gray-900 mb-2">
                    Does the COLOR match the WORD?
                </div>
                <div className="text-sm text-gray-600">
                    Focus on the color, not the text!
                </div>
            </div>

            {/* Color Display */}
            <div className="flex justify-center mb-8">
                <div
                    className="px-16 py-12 rounded-2xl shadow-lg question-enter"
                    style={{ backgroundColor: currentQuestion.content.displayColor }}
                >
                    <div className="text-6xl font-black text-white text-center">
                        {currentQuestion.content.displayText}
                    </div>
                </div>
            </div>

            {/* Answer Buttons */}
            {!showFeedback && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onPointerDown={(e) => handleAnswer(true, e)}
                        className="p-6 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 select-none touch-none"
                    >
                        ✓ MATCH
                    </button>
                    <button
                        onPointerDown={(e) => handleAnswer(false, e)}
                        className="p-6 bg-red-500 hover:bg-red-600 text-white text-2xl font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 select-none touch-none"
                    >
                        ✗ NO MATCH
                    </button>
                </div>
            )}

            {/* Feedback */}
            {showFeedback && (
                <div className={`text-center mb-6 p-4 rounded-xl ${(currentIndex < questions.length ? questions[currentIndex - 1]?.correctAnswer : currentQuestion.correctAnswer) === (currentIndex < questions.length ? questions[currentIndex - 1]?.content.isMatch : currentQuestion.content.isMatch)
                    ? 'bg-green-100 text-green-900'
                    : 'bg-red-100 text-red-900'
                    }`}>
                    <div className="text-2xl font-bold">
                        {(currentIndex < questions.length ? questions[currentIndex - 1]?.correctAnswer : currentQuestion.correctAnswer) === (currentIndex < questions.length ? questions[currentIndex - 1]?.content.isMatch : currentQuestion.content.isMatch)
                            ? '✓ Correct!'
                            : '✗ Wrong!'}
                    </div>
                </div>
            )}

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
                    <span className="text-2xl">⚡</span>
                    <div>
                        <div className="font-bold text-gray-900">
                            {avgReactionTime > 0 ? avgReactionTime.toFixed(2) : 0}s
                        </div>
                        <div className="text-gray-600">Avg Time</div>
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
