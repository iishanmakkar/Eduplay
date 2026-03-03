'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { CreativeStoryContent } from '@/lib/game-engine/content-pools/creative-story'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function CreativeStory({ onGameEnd, studentId = 'demo' }: any) {
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
        const pool = CreativeStoryContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 10, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
    }

    const isSubmitting = useRef(false) // Lock

    // ... (omitting lines between)

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
            toast.success('Creative!', { icon: '📖' })
        } else toast.error('Try again!')

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            } else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">📖 Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="text-sm text-violet-600 mb-2">{q.content.context}</div>
            <div className="text-2xl mb-6 bg-violet-50 p-6 rounded-xl font-serif select-none">{q.content.prompt}</div>
            <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onPointerDown={(e) => handleAnswer(i, e)}
                        className="p-4 text-lg bg-violet-500 text-white font-bold rounded-xl hover:bg-violet-600 transition-all active:scale-95 select-none touch-none"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}
