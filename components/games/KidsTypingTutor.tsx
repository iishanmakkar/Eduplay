'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { KidsTypingTutorContent } from '@/lib/game-engine/content-pools/kids-typing-tutor'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { GradeBand } from '@/lib/game-engine/grade-mapper'
import '../../styles/game-animations.css'

interface KidsTypingTutorProps {
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number) => void
    studentId?: string
    grade?: GradeBand
}

export default function KidsTypingTutor({ onGameEnd, studentId = 'demo', grade = 'K2' }: KidsTypingTutorProps) {
    const [lessons] = useState(KidsTypingTutorContent.getLessons())
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
    const [input, setInput] = useState('')
    const [startTime, setStartTime] = useState(0)
    const [wpm, setWpm] = useState(0)
    const [accuracy, setAccuracy] = useState(100)
    const [errors, setErrors] = useState(0)
    const [score, setScore] = useState(0)
    const [completed, setCompleted] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const [showKeyboard, setShowKeyboard] = useState(true)
    const [highlightKey, setHighlightKey] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const feedbackSystem = useRef(new FeedbackSystem(true))

    const currentLesson = lessons[currentLessonIndex]
    const currentExercise = currentLesson.exercises[currentExerciseIndex]
    const targetText = currentExercise.text
    const keyboard = KidsTypingTutorContent.getKeyboardLayout()
    const handGuide = KidsTypingTutorContent.getHandPlacementGuide()

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        setStartTime(Date.now())
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    useEffect(() => {
        if (input.length > 0 && startTime > 0) {
            const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
            const wordsTyped = input.length / 5 // standard: 5 chars = 1 word
            const currentWpm = Math.round(wordsTyped / timeElapsed)
            setWpm(currentWpm)

            // Calculate accuracy
            let correct = 0
            for (let i = 0; i < input.length; i++) {
                if (input[i] === targetText[i]) correct++
            }
            const acc = Math.round((correct / input.length) * 100)
            setAccuracy(acc)
        }

        // Highlight next key to press
        if (input.length < targetText.length) {
            setHighlightKey(targetText[input.length])
        } else {
            setHighlightKey(null)
        }
    }, [input, startTime, targetText])

    const isSubmitting = useRef(false) // Lock

    const validateInput = (newInput: string) => {
        if (isSubmitting.current) return

        // Check if last character is correct
        if (newInput.length > input.length) {
            const lastChar = newInput[newInput.length - 1]
            const expectedChar = targetText[newInput.length - 1]

            if (lastChar !== expectedChar) {
                setErrors(prev => prev + 1)
                feedbackSystem.current.showWrongAnimation()
            } else {
                feedbackSystem.current.showCorrectAnimation()
            }
        }

        setInput(newInput)

        // Check if exercise complete
        if (newInput === targetText) {
            handleExerciseComplete()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateInput(e.target.value)
    }

    const handleVirtualKey = (key: string) => {
        if (isSubmitting.current) return
        if (input.length < targetText.length) {
            validateInput(input + key)
        }
    }

    const handleExerciseComplete = () => {
        if (isSubmitting.current) return
        isSubmitting.current = true

        const timeElapsed = (Date.now() - startTime) / 1000 / 60
        const words = targetText.length / 5
        const finalWPM = Math.round(words / timeElapsed) || 0

        const targetWPM = currentExercise.targetWPM
        const bonus = finalWPM >= targetWPM ? 2 : 1
        const accuracyBonus = accuracy >= 95 ? 1.5 : accuracy >= 85 ? 1.2 : 1
        const basePoints = currentExercise.difficulty === 'EASY' ? 10 : currentExercise.difficulty === 'MEDIUM' ? 20 : 30

        // Ensure valid distinct points
        const points = Math.max(10, Math.round(basePoints * bonus * accuracyBonus))

        setScore(prev => prev + points)
        setCompleted(prev => prev + 1)

        feedbackSystem.current.showCorrectAnimation()
        if (finalWPM >= targetWPM && accuracy >= 95) {
            feedbackSystem.current.triggerConfetti('perfect')
            toast.success(`Perfect! ${finalWPM} WPM with ${accuracy}% accuracy! +${points} XP`, {
                icon: '🌟',
                duration: 3000
            })
        } else {
            toast.success(`Great job! ${finalWPM} WPM! +${points} XP`, {
                icon: '⌨️',
                duration: 2000
            })
        }

        // Move to next exercise
        setTimeout(() => {
            if (currentExerciseIndex < currentLesson.exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1)
                setInput('')
                setStartTime(Date.now())
                setErrors(0)
                isSubmitting.current = false
                setTimeout(() => inputRef.current?.focus(), 50)
            } else if (currentLessonIndex < lessons.length - 1) {
                // Move to next lesson
                setCurrentLessonIndex(prev => prev + 1)
                setCurrentExerciseIndex(0)
                setInput('')
                setStartTime(Date.now())
                setErrors(0)
                toast.success(`Lesson ${currentLessonIndex + 1} Complete! 🎉`, { duration: 2000 })
                isSubmitting.current = false
                setTimeout(() => inputRef.current?.focus(), 50)
            } else {
                // All lessons complete!
                onGameEnd(score, completed, lessons.reduce((sum, l) => sum + l.exercises.length, 0))
            }
        }, 2000)
    }

    const getKeyColor = (key: string) => {
        if (key === highlightKey) return 'bg-yellow-400 animate-pulse scale-110'
        if (handGuide.homeRow.left.includes(key) || handGuide.homeRow.right.includes(key)) {
            return 'bg-blue-200 border-blue-400'
        }
        if (currentLesson.keys.includes(key)) return 'bg-green-100'
        return 'bg-gray-100'
    }

    const getFingerForKey = (key: string) => {
        const { leftHand, rightHand } = handGuide
        if (leftHand.pinky.includes(key)) return '👈 Left Pinky'
        if (leftHand.ring.includes(key)) return '👈 Left Ring'
        if (leftHand.middle.includes(key)) return '👈 Left Middle'
        if (leftHand.index.includes(key)) return '👈 Left Index'
        if (rightHand.index.includes(key)) return 'Right Index 👉'
        if (rightHand.middle.includes(key)) return 'Right Middle 👉'
        if (rightHand.ring.includes(key)) return 'Right Ring 👉'
        if (rightHand.pinky.includes(key)) return 'Right Pinky 👉'
        return 'Thumb 👍'
    }

    if (showCountdown) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">⌨️</div>
                    <div className="text-2xl font-bold text-gray-900">Loading Typing Tutor...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                        {currentLesson.title}
                    </div>
                    <div className="text-sm text-gray-600">{currentLesson.description}</div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold text-purple-600">{score}</div>
                    <div className="text-sm text-gray-600">XP</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">{wpm}</div>
                    <div className="text-sm text-gray-600">WPM</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-red-600">{errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">{completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                </div>
            </div>

            {/* Exercise Text */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                <div className="text-sm text-gray-600 mb-2">
                    Exercise {currentExerciseIndex + 1} of {currentLesson.exercises.length} • Target: {currentExercise.targetWPM} WPM
                </div>
                <div className="text-3xl font-mono mb-4 leading-relaxed">
                    {targetText.split('').map((char, i) => (
                        <span
                            key={i}
                            className={`${i < input.length
                                ? input[i] === char
                                    ? 'text-green-600 bg-green-100'
                                    : 'text-red-600 bg-red-100'
                                : i === input.length
                                    ? 'bg-yellow-200 animate-pulse'
                                    : 'text-gray-400'
                                } px-1 rounded`}
                        >
                            {char === ' ' ? '␣' : char}
                        </span>
                    ))}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    className="w-full p-4 text-2xl font-mono border-4 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Start typing here..."
                    autoComplete="off"
                    spellCheck="false"
                />
            </div>

            {/* Next Key Hint */}
            {highlightKey && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6 text-center">
                    <div className="text-sm text-gray-600 mb-1">Next Key:</div>
                    <div className="text-6xl font-bold text-yellow-600 mb-2">{highlightKey === ' ' ? 'SPACE' : highlightKey.toUpperCase()}</div>
                    <div className="text-sm text-gray-700">{getFingerForKey(highlightKey)}</div>
                </div>
            )}

            {/* Keyboard Visualization */}
            {showKeyboard && (
                <div className="bg-gray-800 rounded-xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-white font-bold">Visual Keyboard</div>
                        <button
                            onClick={() => setShowKeyboard(false)}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Hide
                        </button>
                    </div>

                    {/* Number Row */}
                    <div className="flex gap-1 justify-center mb-1">
                        {keyboard.row1.map(key => (
                            <button
                                key={key}
                                onClick={() => handleVirtualKey(key)}
                                className={`w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-lg transition-all ${getKeyColor(key)} border-2 hover:scale-110 active:scale-95`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* Top Row */}
                    <div className="flex gap-1 justify-center mb-1">
                        {keyboard.row2.map(key => (
                            <button
                                key={key}
                                onClick={() => handleVirtualKey(key)}
                                className={`w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-lg transition-all ${getKeyColor(key)} border-2 hover:scale-110 active:scale-95`}
                            >
                                {key.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Home Row */}
                    <div className="flex gap-1 justify-center mb-1">
                        {keyboard.row3.map(key => (
                            <button
                                key={key}
                                onClick={() => handleVirtualKey(key)}
                                className={`w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-lg transition-all ${getKeyColor(key)} border-2 hover:scale-110 active:scale-95`}
                            >
                                {key.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Bottom Row */}
                    <div className="flex gap-1 justify-center mb-2">
                        {keyboard.row4.map(key => (
                            <button
                                key={key}
                                onClick={() => handleVirtualKey(key)}
                                className={`w-12 h-12 flex items-center justify-center rounded font-mono font-bold text-lg transition-all ${getKeyColor(key)} border-2 hover:scale-110 active:scale-95`}
                            >
                                {key.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Space Bar */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleVirtualKey(' ')}
                            className={`w-96 h-12 flex items-center justify-center rounded font-mono font-bold transition-all ${highlightKey === ' ' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-100'} border-2 hover:bg-gray-200 active:scale-95`}
                        >
                            SPACE
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 justify-center mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded"></div>
                            <span className="text-white">Home Row</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border-2 rounded"></div>
                            <span className="text-white">This Lesson</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-400 border-2 rounded"></div>
                            <span className="text-white">Next Key</span>
                        </div>
                    </div>
                </div>
            )}

            {!showKeyboard && (
                <button
                    onClick={() => setShowKeyboard(true)}
                    className="w-full p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 mb-4"
                >
                    Show Keyboard
                </button>
            )}

            {/* Hand Placement Guide */}
            <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-center mb-2 font-bold text-blue-900">✋ Hand Placement Guide</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                        <div className="font-bold text-blue-700 mb-2">Left Hand</div>
                        <div className="space-y-1 text-gray-700">
                            <div>Pinky: A</div>
                            <div>Ring: S</div>
                            <div>Middle: D</div>
                            <div>Index: F</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-blue-700 mb-2">Right Hand</div>
                        <div className="space-y-1 text-gray-700">
                            <div>Index: J</div>
                            <div>Middle: K</div>
                            <div>Ring: L</div>
                            <div>Pinky: ;</div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3 text-xs text-gray-600">
                    💡 Tip: Keep your fingers on the home row (ASDF JKL;) and reach for other keys!
                </div>
            </div>
        </div>
    )
}
