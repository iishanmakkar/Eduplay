'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentGenerator } from '@/lib/game-engine/content-generator'
import { TypingSpeedContent } from '@/lib/game-engine/content-pools/typing-speed'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import toast from 'react-hot-toast'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function TypingSpeed({ onGameEnd, studentId = 'demo' }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [input, setInput] = useState('')
    const [startTime, setStartTime] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const isSubmitting = useRef(false) // Lock

    const feedbackSystem = useRef(new FeedbackSystem(true))
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = TypingSpeedContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const q = generator.generateSession(pool, 5, { easy: 100, medium: 0, hard: 0 })
        setQuestions(q)
        setStartTime(Date.now())
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const handleSubmit = (e: any) => {
        e.preventDefault()

        if (isSubmitting.current) return
        isSubmitting.current = true

        const q = questions[currentIndex]
        const isCorrect = input.trim() === q.content.text
        const timeSpent = (Date.now() - startTime) / 1000
        const wpm = Math.round((input.length / 5) / (timeSpent / 60))

        if (isCorrect) {
            // Calculate XP using the centralized engine
            // Base score 20, accuracy 1 (since correct), hints 0, mistakes 0 (simplified for single attempt)
            const xpResult = ScoringEngine.calculateXP({
                baseScore: 20,
                accuracy: 1,
                timeSpent,
                expectedTime: q.timeLimit || 60, // Use dynamic time limit
                streak: correct + 1,
                hintsUsed: 0,
                mistakes: 0,
                difficulty: 2 // Default medium for now, or derive from q.points
            })

            setScore(s => s + xpResult.totalXP)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
            feedbackSystem.current.showXPPopup(xpResult.totalXP)
            toast.success(`${wpm} WPM! +${xpResult.totalXP} XP`, { icon: '⌨️' })
        } else toast.error('Check your typing!')

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                setInput('')
                setStartTime(Date.now())
                isSubmitting.current = false
                setTimeout(() => inputRef.current?.focus(), 50)
            } else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">⌨️ Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-500 to-gray-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="text-2xl mb-6 bg-slate-100 p-6 rounded-xl font-mono select-none">{q.content.text}</div>
            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-4 text-xl border-4 border-slate-300 rounded-xl font-mono"
                    placeholder="Type here..."
                    autoComplete="off"
                    autoFocus
                />
                <button
                    type="submit"
                    className={`w-full mt-4 p-4 bg-slate-500 text-white font-bold rounded-xl hover:bg-slate-600 transition-all active:scale-95 ${isSubmitting.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting.current}
                >
                    Submit
                </button>
            </form>
        </div>
    )
}
