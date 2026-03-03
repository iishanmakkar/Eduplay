'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

const SEQUENCES = {
    EASY: [
        { pattern: ['🔵', '🔴', '🔵', '🔴'], next: '🔵', options: ['🔵', '🔴', '🟢', '🟡'] },
        { pattern: ['⭐', '⭐', '❤️', '⭐', '⭐'], next: '❤️', options: ['⭐', '❤️', '🌙', '☀️'] },
    ],
    MEDIUM: [
        { pattern: ['🔺', '🔵', '🔺', '🔺', '🔵', '🔺', '🔺', '🔺'], next: '🔵', options: ['🔺', '🔵', '🟢', '🔴'] },
        { pattern: ['1️⃣', '2️⃣', '2️⃣', '3️⃣', '3️⃣', '3️⃣'], next: '4️⃣', options: ['4️⃣', '3️⃣', '5️⃣', '2️⃣'] },
    ],
    HARD: [
        { pattern: ['A', 'B', 'C', 'B', 'C', 'D', 'C', 'D'], next: 'E', options: ['E', 'D', 'F', 'C'] },
        { pattern: ['2', '4', '8', '16'], next: '32', options: ['32', '24', '20', '18'] },
    ],
}

interface SequenceBuilderProps {
    onGameEnd: (
        score: number,
        accuracy: number,
        timeSpent: number,
        difficulty: string,
        reactionTime?: number
    ) => void
    initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    grade?: GradeBand
}

export default function SequenceBuilder({ onGameEnd, initialDifficulty = 'MEDIUM', grade = '35' }: SequenceBuilderProps) {
    const [difficulty, setDifficulty] = useState(initialDifficulty)
    const [currentSequence, setCurrentSequence] = useState(0)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [startTime] = useState(Date.now())
    const [roundStartTime, setRoundStartTime] = useState(Date.now())
    const [reactionTimes, setReactionTimes] = useState<number[]>([])

    const sequences = SEQUENCES[difficulty]
    const maxSequences = sequences.length * 2
    const sequence = sequences[currentSequence % sequences.length]

    const handleAnswer = (answer: string) => {
        const reactionTime = Date.now() - roundStartTime
        setReactionTimes([...reactionTimes, reactionTime])

        setSelectedAnswer(answer)
        setShowResult(true)

        const isCorrect = answer === sequence.next
        if (isCorrect) {
            const timeBonus = Math.max(0, 10000 - reactionTime) / 20
            const difficultyMultiplier = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 1.5 : 2
            const points = Math.floor((120 + timeBonus) * difficultyMultiplier)
            setScore(prev => prev + points)
            setCorrect(prev => prev + 1)
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 }
            })
        }

        setTimeout(() => {
            if (currentSequence + 1 >= maxSequences) {
                endGame()
            } else {
                setCurrentSequence(prev => prev + 1)
                setShowResult(false)
                setSelectedAnswer(null)
                setRoundStartTime(Date.now())
            }
        }, 1500)
    }

    const endGame = () => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        const accuracy = (correct / maxSequences) * 100
        const avgReactionTime = reactionTimes.length > 0
            ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
            : 0
        onGameEnd(score, accuracy, timeSpent, difficulty, avgReactionTime)
    }

    if (currentSequence >= maxSequences) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[500px] p-8"
            >
                <div className="text-6xl mb-4">🔄</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sequences Complete!</h2>
                <p className="text-xl text-gray-600 mb-6">You scored {score} points</p>
                <div className="bg-teal-50 rounded-xl p-6 w-full max-w-md">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Correct:</span>
                        <span className="font-bold text-teal-600">{correct}/{maxSequences}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">Accuracy:</span>
                        <span className="font-bold text-teal-600">{Math.round((correct / maxSequences) * 100)}%</span>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🔄</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Sequence Builder</h2>
                        <p className="text-sm text-gray-500">Sequence {currentSequence + 1}/{maxSequences}</p>
                    </div>
                </div>
                <div className="text-lg font-semibold text-teal-600">
                    {score} XP
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <p className="text-center text-gray-600 mb-6">What comes next in the sequence?</p>

                <div className="flex gap-3 justify-center mb-8 flex-wrap">
                    {sequence.pattern.map((item, index) => (
                        <div key={index} className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg text-3xl font-bold">
                            {item}
                        </div>
                    ))}
                    <div className="w-16 h-16 flex items-center justify-center bg-teal-100 rounded-lg text-3xl font-bold border-2 border-teal-500 border-dashed">
                        ?
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {sequence.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(option)}
                            disabled={showResult}
                            className={`p-6 rounded-lg text-3xl font-bold transition ${showResult && option === sequence.next
                                ? 'bg-green-100 border-2 border-green-500'
                                : showResult && option === selectedAnswer && option !== sequence.next
                                    ? 'bg-red-100 border-2 border-red-500'
                                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
