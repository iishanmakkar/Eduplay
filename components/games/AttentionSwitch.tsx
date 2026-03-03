'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { AttentionSwitchContent } from '@/lib/game-engine/content-pools/attention-switch'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function AttentionSwitch({ onGameEnd, studentId = 'demo' }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [answer, setAnswer] = useState('')
    const [showCountdown, setShowCountdown] = useState(true)
    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = AttentionSwitchContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 10, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
    }

    const isSubmitting = useRef(false) // Lock

    // ... (omitting lines between)

    const handleSubmit = (e: any) => {
        e.preventDefault()

        if (isSubmitting.current) return
        isSubmitting.current = true

        const isCorrect = parseInt(answer) === questions[currentIndex].correctAnswer
        if (isCorrect) {
            setScore(s => s + 20)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
            toast.success('Focused!', { icon: '👁️' })
        } else toast.error('Wrong!')

        setTimeout(() => {
            setAnswer('')
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            } else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">👁️ Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="text-2xl font-bold mb-4">{q.content.task}</div>
            <div className="flex gap-2 justify-center mb-6 text-5xl select-none">
                {q.content.items.map((item: string, i: number) => <div key={i}>{item}</div>)}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
                <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} className="flex-1 p-4 text-2xl border-4 border-cyan-300 rounded-xl text-center" placeholder="Count" />
                <button
                    type="submit"
                    className="px-8 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 transition-all active:scale-95 disabled:opacity-50"
                    disabled={isSubmitting.current}
                >
                    Go
                </button>
            </form>
        </div>
    )
}
