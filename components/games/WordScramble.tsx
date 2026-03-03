'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { WordScrambleContent, WordScrambleQuestion } from '@/lib/game-engine/content-pools/word-scramble'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem, getEncouragingMessage } from '@/lib/game-engine/feedback'
import '../../styles/game-animations.css'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface WordScrambleProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    grade?: GradeBand
    mode?: SessionMode
}

export default function WordScramble({
    onGameEnd,
    studentId = 'demo',
    difficulty = 2,
    mode = SessionMode.STANDARD
}: WordScrambleProps) {
    // Game state
    const [questions, setQuestions] = useState<WordScrambleQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    // Scoring state
    const [score, setScore] = useState(0)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [streak, setStreak] = useState(0)
    const [mistakes, setMistakes] = useState(0)
    const [hintsUsed, setHintsUsed] = useState(0)

    // Time tracking
    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [totalTimeSpent, setTotalTimeSpent] = useState(0)

    // UI state
    const [showCountdown, setShowCountdown] = useState(true)
    const initializedRef = useRef(false)

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const inputRef = useRef<HTMLInputElement>(null)
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

        const pool = WordScrambleContent.generateContentPool()
        const seed = ContentGenerator.generateSeed(studentId)
        const generator = new ContentGenerator(Number(seed))
        const difficultyMix = ContentGenerator.getDifficultyMix(difficulty)
        const sessionQuestions = generator.generateSession(pool, sessionConfig.questionCount, difficultyMix)

        setQuestions(sessionQuestions as WordScrambleQuestion[])
        setTimeLeft(sessionConfig.timeLimit || 600)
        setQuestionStartTime(Date.now())
        setGameStarted(true)

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100)
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

    const isSubmitting = useRef(false) // Ref Lock
    const lastAnswerTime = useRef(0)

    const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault()
        const now = Date.now()
        // Debounce (200ms) and Submission Lock
        if (showFeedback || !gameStarted || !userInput.trim() || isSubmitting.current || (now - lastAnswerTime.current < 200)) return

        isSubmitting.current = true
        lastAnswerTime.current = now

        const currentQuestion = questions[currentIndex]
        const isCorrect = userInput.toLowerCase().trim() === currentQuestion.content.word.toLowerCase()
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
                expectedTime: currentQuestion.timeLimit || 15,
                streak: newStreak,
                hintsUsed: showHint ? 1 : 0,
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
                icon: '📝',
                duration: 1500
            })
        } else {
            setStreak(0)
            setMistakes(prev => prev + 1)

            feedbackSystem.current.showWrongAnimation()
            toast.error(`Not quite! The word was: ${currentQuestion.content.word}`, {
                duration: 2000
            })
        }

        // Move to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1)
                setUserInput('')
                setShowFeedback(false)
                setShowHint(false)
                isSubmitting.current = false // Unlock
                setQuestionStartTime(Date.now())
                inputRef.current?.focus()
            } else {
                endGame()
            }
        }, 2000)
    }

    const handleHint = () => {
        if (!showHint && !showFeedback) {
            setShowHint(true)
            setHintsUsed(prev => prev + 1)
            toast('Hint revealed! -20% XP', {
                icon: '💡',
                duration: 2000
            })
        }
    }

    const endGame = () => {
        setGameStarted(false)

        const accuracy = correctAnswers / questions.length
        if (accuracy >= 0.9 && hintsUsed === 0) {
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
                    <div className="text-6xl mb-4 animate-bounce">📝</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Word Scramble...</div>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const combo = ScoringEngine.getComboLevel(streak)

    // Category colors
    const categoryColors: Record<string, string> = {
        animals: 'from-green-500 to-green-600',
        food: 'from-red-500 to-red-600',
        countries: 'from-blue-500 to-blue-600',
        sports: 'from-orange-500 to-orange-600',
        science: 'from-purple-500 to-purple-600',
        technology: 'from-cyan-500 to-cyan-600',
        nature: 'from-emerald-500 to-emerald-600',
        objects: 'from-gray-500 to-gray-600'
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
                    className={`h-full bg-gradient-to-r ${categoryColors[currentQuestion.content.category]} transition-all duration-300`}
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
                    <div className={`text-4xl font-bold bg-gradient-to-r ${categoryColors[currentQuestion.content.category]} bg-clip-text text-transparent`}>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${categoryColors[currentQuestion.content.category]}`}>
                            {currentQuestion.content.category.toUpperCase()}
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

                {/* Scrambled Word */}
                <div className="text-center mb-6">
                    <div className="text-sm text-gray-600 mb-2">Unscramble this word:</div>
                    <div className="text-5xl font-bold text-gray-900 tracking-wider mb-4 letter-spacing-wide">
                        {currentQuestion.content.scrambled.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                        {currentQuestion.content.word.length} letters
                    </div>
                </div>

                {/* Hint */}
                {showHint && currentQuestion.content.hint && (
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg slide-up">
                        <div className="flex items-start gap-2">
                            <span className="text-2xl">💡</span>
                            <div>
                                <div className="font-bold text-yellow-900 mb-1">Hint:</div>
                                <div className="text-yellow-800">{currentQuestion.content.hint}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Form */}
                {/* Interactive Letter Tiles */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {/* Answer Display */}
                    <div className="w-full mb-4 flex justify-center gap-2 min-h-[4rem]">
                        {userInput.split('').map((char, i) => (
                            <button
                                key={`ans-${i}`}
                                onClick={() => {
                                    const newInput = userInput.slice(0, i) + userInput.slice(i + 1)
                                    setUserInput(newInput)
                                }}
                                className="w-12 h-12 text-2xl font-bold bg-white border-2 border-blue-500 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-500 transition-all animate-pop touch-manipulation select-none"
                            >
                                {char.toUpperCase()}
                            </button>
                        ))}
                        {/* Placeholder for remaining length */}
                        {Array.from({ length: Math.max(0, currentQuestion.content.word.length - userInput.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg" />
                        ))}
                    </div>

                    {/* Letter Pool */}
                    <div className="w-full flex flex-wrap justify-center gap-2">
                        {currentQuestion.content.scrambled.split('').map((char, i) => {
                            // Count occurrences in scrambled vs userInput to determine availability
                            const charCountInScrambled = currentQuestion.content.scrambled.split('').filter(c => c === char).length
                            const charCountInInput = userInput.split('').filter(c => c === char).length
                            const isAvailable = charCountInInput < charCountInScrambled

                            // Only show button if available (or disable it)
                            return (
                                <button
                                    key={`pool-${i}`}
                                    onClick={() => {
                                        if (userInput.length < currentQuestion.content.word.length) {
                                            setUserInput(prev => prev + char)
                                        }
                                    }}
                                    disabled={!isAvailable || showFeedback}
                                    className={`w-14 h-14 text-2xl font-bold rounded-xl transition-all shadow-sm touch-manipulation select-none active:scale-95 ${isAvailable
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 hover:bg-blue-200 hover:scale-105'
                                        : 'bg-gray-100 text-gray-300 border-2 border-gray-200 scale-90 opacity-50'
                                        }`}
                                >
                                    {char.toUpperCase()}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleHint}
                        disabled={showHint || showFeedback}
                        className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all touch-manipulation select-none active:scale-95"
                    >
                        💡 Hint (-20% XP)
                    </button>
                    <button
                        type="button"
                        onClick={() => setUserInput('')}
                        disabled={!userInput}
                        className="px-6 py-3 bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 font-bold rounded-xl transition-all touch-manipulation select-none active:scale-95"
                    >
                        Clear
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e)}
                        disabled={showFeedback || userInput.length !== currentQuestion.content.word.length}
                        className={`flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all touch-manipulation select-none active:scale-95`}
                    >
                        Submit
                    </button>
                </div>

                {/* Correct Answer Display */}
                {showFeedback && userInput.toLowerCase().trim() !== currentQuestion.content.word.toLowerCase() && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div className="text-center">
                            <div className="text-sm text-blue-700 mb-1">The correct word was:</div>
                            <div className="text-3xl font-bold text-blue-900">{currentQuestion.content.word.toUpperCase()}</div>
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
                    <span className="text-2xl">💡</span>
                    <div>
                        <div className="font-bold text-gray-900">{hintsUsed}</div>
                        <div className="text-gray-600">Hints</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
