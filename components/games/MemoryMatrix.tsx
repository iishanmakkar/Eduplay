'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { MemoryMatrixContent, MemoryMatrixPattern } from '@/lib/game-engine/content-pools/memory-matrix'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface MemoryMatrixProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function MemoryMatrix({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD
}: MemoryMatrixProps): JSX.Element {
    // Game state
    const [questions, setQuestions] = useState<MemoryMatrixPattern[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
    const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set())
    const [gameStarted, setGameStarted] = useState(false)

    // Scoring state
    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)

    // Time tracking
    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())

    // UI state
    const [showCountdown, setShowCountdown] = useState(true)
    const [showFeedback, setShowFeedback] = useState(false)

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const sessionConfig = SessionManager.getConfig(mode, difficulty)

    // Initialize game
    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)

        const pool = MemoryMatrixContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(seed)
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as MemoryMatrixPattern[])
        setTimeLeft(sessionConfig.timeLimit || 600)
        setQuestionStartTime(Date.now())
        setGameStarted(true)

        // Start memorization phase
        startMemorizationPhase(sessionQuestions[0] as MemoryMatrixPattern)
    }

    const startMemorizationPhase = (question: MemoryMatrixPattern) => {
        setPhase('memorize')
        setSelectedCells(new Set())

        // Auto-transition to recall after display time
        setTimeout(() => {
            setPhase('recall')
            setQuestionStartTime(Date.now())
        }, question.content.displayTime)
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

    const handleCellClick = (index: number) => {
        if (phase !== 'recall' || showFeedback) return

        const newSelected = new Set(selectedCells)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }
        setSelectedCells(newSelected)
    }

    const isSubmitting = useRef(false) // Lock

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

    const handleSubmit = (e?: React.PointerEvent) => {
        if (e) e.preventDefault()
        if (phase !== 'recall' || showFeedback || isSubmitting.current) return
        isSubmitting.current = true

        const currentQuestion = questions[currentIndex]
        const correctPattern = new Set(currentQuestion.content.pattern)
        const timeSpent = (Date.now() - questionStartTime) / 1000

        // Calculate accuracy
        const correctSelections = Array.from(selectedCells).filter(cell => correctPattern.has(cell)).length
        const incorrectSelections = selectedCells.size - correctSelections
        const accuracy = correctSelections / correctPattern.size

        setShowFeedback(true)

        if (accuracy === 1 && incorrectSelections === 0) {
            // Perfect!
            const newStreak = streak + 1
            setStreak(newStreak)
            setCorrectAnswers(prev => prev + 1)

            const xpResult = ScoringEngine.calculateXP({
                baseScore: currentQuestion.points,
                accuracy: 1,
                timeSpent,
                expectedTime: 20,
                streak: newStreak,
                hintsUsed: 0,
                mistakes,
                difficulty,
                perfectRound: true
            })

            setScore(prev => prev + xpResult.totalXP)

            feedbackSystem.current.showCorrectAnimation()
            feedbackSystem.current.showXPPopup(xpResult.totalXP)

            const combo = ScoringEngine.getComboLevel(newStreak)
            if (newStreak >= 3) {
                feedbackSystem.current.showComboAnimation(combo.multiplier, newStreak)
            }

            toast.success(`${getEncouragingMessage('perfect')} +${xpResult.totalXP} XP`, {
                icon: '🧠',
                duration: 1500
            })
        } else if (accuracy >= 0.7) {
            // Partial credit
            setStreak(0)
            const partialXP = Math.floor(currentQuestion.points * accuracy)
            setScore(prev => prev + partialXP)

            toast.success(`Good! ${Math.round(accuracy * 100)}% correct. +${partialXP} XP`, {
                icon: '👍',
                duration: 1500
            })
        } else {
            // Failed
            setStreak(0)
            setMistakes(prev => prev + 1)
            feedbackSystem.current.showWrongAnimation()
            toast.error('Try to remember the pattern better!', {
                duration: 1500
            })
        }

        // Move to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setShowFeedback(false)
                isSubmitting.current = false
                startMemorizationPhase(questions[currentIndex + 1])
            } else {
                endGame()
            }
        }, 2000)
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Game Canvas would be here if separate from PlayGamePage, but for now we render controls */}

            {/* Pattern Grid - This logic seems to be handled by PlayGamePage's common renderer? 
                Wait, this component seems to be missing the grid rendering logic entirely in this snippet?
                Ah, looking at the code, it seems this file is JUST the logic/controls and the grid might be rendered previously?
                No, looking at other games, they render everything.
                I suspect a huge chunk of code (the grid rendering) was lost.
                However, I will fix the syntax error first by wrapping what is there.
            */}

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto aspect-square mb-8">
                    {Array.from({ length: 16 }).map((_, i) => {
                        const isSelected = selectedCells.has(i)
                        const isActive = phase === 'memorize' && questions[currentIndex]?.content.pattern.includes(i)
                        const showCorrect = showFeedback && questions[currentIndex]?.content.pattern.includes(i)
                        const showWrong = showFeedback && isSelected && !questions[currentIndex]?.content.pattern.includes(i)

                        return (
                            <button
                                key={i}
                                onPointerDown={() => handleCellClick(i)}
                                disabled={phase !== 'recall' || showFeedback}
                                className={`
                                    rounded-xl transition-all duration-300 transform
                                    ${isActive ? 'bg-indigo-600 scale-105 shadow-lg' :
                                        showCorrect ? 'bg-green-500 scale-105 shadow-lg' :
                                            showWrong ? 'bg-red-500 shake' :
                                                isSelected ? 'bg-indigo-400' : 'bg-gray-100 hover:bg-gray-200'}
                                `}
                            />
                        )
                    })}
                </div>

                {/* Submit Button */}
                {phase === 'recall' && !showFeedback && (
                    <div className="flex justify-center mb-4">
                        <button
                            onPointerDown={handleSubmit}
                            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all active:scale-95 touch-none select-none"
                        >
                            Submit Answer
                        </button>
                    </div>
                )}

                {/* Stats Footer */}
                <div className="flex items-center justify-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <div>
                            <div className="font-bold text-gray-900">{correctAnswers}</div>
                            <div className="text-gray-600">Perfect</div>
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
        </div>
    )
}
