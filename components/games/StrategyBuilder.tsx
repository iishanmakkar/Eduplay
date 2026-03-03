'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator, SessionMode } from '@/lib/game-engine/content-generator'
import { StrategyBuilderContent } from '@/lib/game-engine/content-pools/strategy-builder'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function StrategyBuilder({ onGameEnd, studentId = 'demo', difficulty = 2 }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = StrategyBuilderContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 10, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
    }

    const isSubmitting = useRef(false) // Lock

    const handleAnswer = (idx: number, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isSubmitting.current) return
        isSubmitting.current = true

        const isCorrect = idx === questions[currentIndex].correctAnswer
        if (isCorrect) {
            setScore(s => s + 20)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
        }
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            } else onGameEnd(score, correct, questions.length)
        }, 1000)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8">Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8">
            <div className="text-4xl font-bold mb-4">{score} XP</div>
            <div className="text-xl mb-4">{q.content.scenario}</div>
            <div className="text-lg font-bold mb-4">{q.content.goal}</div>
            <div className="space-y-2">
                {q.content.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onPointerDown={(e) => handleAnswer(i, e)}
                        className="w-full p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all active:scale-95 touch-none select-none"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}
