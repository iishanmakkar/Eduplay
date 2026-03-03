'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { MemoryGridContent } from '@/lib/game-engine/content-pools/memory-grid-advanced'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function MemoryGridAdvanced({ onGameEnd, studentId = 'demo' }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
    const [selected, setSelected] = useState<string[]>([])
    const [showCountdown, setShowCountdown] = useState(true)
    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = MemoryGridContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 10, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
        setTimeout(() => setPhase('recall'), 3000)
    }

    const isSubmitting = useRef(false) // Lock

    const handleSubmit = (e?: React.PointerEvent) => {
        if (e) e.preventDefault()
        if (isSubmitting.current) return
        isSubmitting.current = true

        const isCorrect = selected.length === questions[currentIndex].correctAnswer.length
        if (isCorrect) {
            setScore(s => s + 20)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
        }
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setPhase('memorize')
                setSelected([])
                isSubmitting.current = false
                setTimeout(() => setPhase('recall'), 3000)
            } else onGameEnd(score, correct, questions.length)
        }, 1000)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8">Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8">
            <div className="text-4xl font-bold mb-4">{score} XP</div>
            <div className="text-2xl mb-4">{phase === 'memorize' ? 'MEMORIZE' : 'RECALL'}</div>
            {phase === 'memorize' && (
                <div className="flex gap-4 justify-center text-6xl select-none">
                    {q.content.items.map((item: string, i: number) => <div key={i}>{item}</div>)}
                </div>
            )}
            {phase === 'recall' && (
                <div>
                    <div className="text-lg mb-4">Selected: {selected.join(' ')}</div>
                    <button
                        onPointerDown={(e) => handleSubmit(e)}
                        className="w-full p-4 bg-purple-500 text-white rounded-xl touch-none select-none active:scale-95 transition-all"
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    )
}
