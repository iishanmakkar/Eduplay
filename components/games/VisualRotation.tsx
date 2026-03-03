'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { VisualRotationContent } from '@/lib/game-engine/content-pools/visual-rotation'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function VisualRotation({ onGameEnd, studentId = 'demo' }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const initializedRef = useRef(false)
    const isSubmitting = useRef(false) // Lock

    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true
            initGame()
        }
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = VisualRotationContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 10, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
    }

    const handleAnswer = (idx: number, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isSubmitting.current) return
        isSubmitting.current = true

        const isCorrect = idx === questions[currentIndex].correctAnswer
        if (isCorrect) {
            // Calculate XP using the centralized engine
            const xpResult = ScoringEngine.calculateXP({
                baseScore: 20,
                accuracy: 1,
                timeSpent: 5, // Placeholder
                expectedTime: 10,
                streak: correct + 1,
                hintsUsed: 0,
                mistakes: 0,
                difficulty: 2
            })

            setScore(s => s + xpResult.totalXP)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
            feedbackSystem.current.showXPPopup(xpResult.totalXP)
            toast.success(`Correct! +${xpResult.totalXP} XP`, { icon: '🔄' })
        } else toast.error('Wrong!')

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            }
            else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">🔄 Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="text-center mb-6">
                <div className="text-xl mb-4 text-gray-700">
                    Target: Rotate <span className="font-bold">{q.content.rotation}°</span>
                </div>
                <div
                    className="text-9xl mb-6 select-none inline-block transition-transform duration-500"
                    style={{ transform: `rotate(${q.content.initialRotation || 0}deg)` }}
                >
                    {q.content.shape}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {q.options.map((angle: number | string, i: number) => (
                    <button
                        key={i}
                        onPointerDown={(e) => handleAnswer(i, e)}
                        disabled={isSubmitting.current}
                        className="h-32 flex items-center justify-center bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all active:scale-95 select-none touch-none touch-manipulation"
                    >
                        <div
                            className="text-6xl transition-transform duration-300"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            {q.content.shape}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
