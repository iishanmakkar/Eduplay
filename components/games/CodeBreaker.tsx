'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ContentGenerator, SessionMode, SessionManager } from '@/lib/game-engine/content-generator'
import { CodeBreakerContent, CodeBreakerQuestion } from '@/lib/game-engine/content-pools/code-breaker'
import { ScoringEngine } from '@/lib/game-engine/scoring'
import { FeedbackSystem } from '@/lib/game-engine/feedback'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

export default function CodeBreaker({ onGameEnd, studentId = 'demo', difficulty = 2, mode = SessionMode.STANDARD }: any) {
    const [questions, setQuestions] = useState<CodeBreakerQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [streak, setStreak] = useState(0)
    const [showCountdown, setShowCountdown] = useState(true)
    const isSubmitting = useRef(false) // Lock

    const feedbackSystem = useRef(new FeedbackSystem(true))

    useEffect(() => {
        initGame()
    }, [])

    const initGame = async () => {
        await FeedbackSystem.showCountdown()
        setShowCountdown(false)
        const pool = CodeBreakerContent.generateContentPool()
        const generator = new ContentGenerator(ContentGenerator.generateSeed(studentId))
        const config = SessionManager.getConfig(mode, difficulty)
        const q = generator.generateSession(pool, config.questionCount, ContentGenerator.getDifficultyMix(difficulty))
        setQuestions(q as CodeBreakerQuestion[])
    }

    const handleAnswer = (idx: number, e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isSubmitting.current) return
        isSubmitting.current = true

        const isCorrect = idx === questions[currentIndex].correctAnswer
        if (isCorrect) {
            const newStreak = streak + 1
            setStreak(newStreak)
            setScore(s => s + 20 * ScoringEngine.getComboLevel(newStreak).multiplier)
            setCorrect(c => c + 1)
            feedbackSystem.current.showCorrectAnimation()
            toast.success('Correct!', { icon: '🔓' })
        } else {
            setStreak(0)
            toast.error('Wrong!')
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
                isSubmitting.current = false
            }
            else onGameEnd(score, correct, questions.length)
        }, 1500)
    }

    if (showCountdown || !questions.length) return <div className="text-center p-8 text-2xl">🔐 Loading...</div>

    const q = questions[currentIndex]
    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">{score} XP</div>
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
                <div className="text-2xl font-bold mb-4">Code: {q.content.code}</div>
                <div className="text-xl mb-2">Pattern: {q.content.pattern}</div>
                <div className="text-sm text-gray-600">💡 Hint: {q.content.hint}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                    <button
                        key={i}
                        onPointerDown={(e) => handleAnswer(i, e)}
                        className="p-4 text-lg font-bold bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all active:scale-95 select-none touch-none"
                    >
                        {opt}
                    </button>
                ))}
            </div>
            <div className="mt-6 text-center">
                <span className="text-2xl font-bold">{streak}</span>
                <span className="text-gray-600 ml-2">Streak 🔥</span>
            </div>
        </div>
    )
}
