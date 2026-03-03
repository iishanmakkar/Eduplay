'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { ShapeConstructorContent } from '@/lib/game-engine/content-pools/shape-constructor'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function ShapeConstructor({ onGameEnd, studentId = 'demo' }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const isSubmitting = useRef(false) // Lock

    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = ShapeConstructorContent.generateContentPool()
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
                accuracy: 1, // Single attempt
                timeSpent: 5, // Placeholder time as we don't track it precisely here yet
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
            toast.success(`Perfect! +${xpResult.totalXP} XP`, { icon: '🎨' })
        } else toast.error('Wrong!')

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            }
            else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">🎨 Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="text-xl mb-4">{q.content.instruction}</div>
            <div className="flex justify-center gap-4 mb-6 text-6xl select-none">
                {q.content.pieces.map((p: string, i: number) => <div key={i}>{p}</div>)}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onPointerDown={(e) => handleAnswer(i, e)}
                        className="text-6xl p-6 bg-red-100 hover:bg-red-200 rounded-xl active:scale-95 select-none touch-none"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}
