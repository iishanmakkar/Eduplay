'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

const CLUES = [
    'Alex has a dog',
    'The person with a cat lives in the blue house',
    'Sam does not have a bird',
]

interface LogicGridDetectiveProps {
    onGameEnd: (
        score: number,
        accuracy: number,
        timeSpent: number,
        difficulty: string,
        mistakes?: number
    ) => void
    initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    grade?: GradeBand
}

export default function LogicGridDetective({ onGameEnd, initialDifficulty = 'MEDIUM', grade = '35' }: LogicGridDetectiveProps) {
    const [difficulty, setDifficulty] = useState(initialDifficulty)
    const [grid, setGrid] = useState<{ [key: string]: string }>({})
    const [mistakes, setMistakes] = useState(0)
    const [completed, setCompleted] = useState(false)
    const [startTime] = useState(Date.now())

    const people = ['Alex', 'Sam', 'Jordan']
    const pets = ['Dog', 'Cat', 'Bird']
    const colors = ['Red', 'Blue', 'Green']

    const solution: { [key: string]: string } = {
        'Alex-pet': 'Dog',
        'Alex-color': 'Red',
        'Sam-pet': 'Cat',
        'Sam-color': 'Blue',
        'Jordan-pet': 'Bird',
        'Jordan-color': 'Green',
    }

    const isSubmitting = useRef(false) // Lock

    const handleCellClick = (person: string, category: 'pet' | 'color', value: string) => {
        if (completed || isSubmitting.current) return

        const key = `${person}-${category}`
        const isCorrect = solution[key] === value

        if (!isCorrect) {
            setMistakes(prev => prev + 1)
        }

        const newGrid = { ...grid, [key]: value }
        setGrid(newGrid)

        // Check if complete
        if (Object.keys(newGrid).length >= 6) {
            checkSolution(newGrid)
        }
    }

    const checkSolution = (currentGrid: { [key: string]: string }) => {
        const isCorrect = Object.keys(solution).every(key => currentGrid[key] === solution[key])

        if (isCorrect) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000)
            const mistakePenalty = mistakes * 50
            const difficultyMultiplier = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 1.5 : 2
            const score = Math.floor(Math.max(0, (600 - mistakePenalty)) * difficultyMultiplier)

            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            })

            setCompleted(true)
            onGameEnd(score, 100, timeSpent, difficulty, mistakes)
        }
    }

    if (completed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[500px] p-8"
            >
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Case Solved!</h2>
                <div className="bg-emerald-50 rounded-xl p-6 w-full max-w-md">
                    <div className="flex justify-between">
                        <span className="text-gray-700">Mistakes:</span>
                        <span className="font-bold text-emerald-600">{mistakes}</span>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🧠</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Logic Grid Detective</h2>
                        <p className="text-sm text-gray-500">Use clues to solve the puzzle</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Mistakes</div>
                    <div className="text-2xl font-bold text-red-600">{mistakes}</div>
                </div>
            </div>

            {/* Clues */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">Clues:</h3>
                <ul className="space-y-2">
                    {CLUES.map((clue, index) => (
                        <li key={index} className="text-blue-800">• {clue}</li>
                    ))}
                </ul>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="space-y-6">
                    {people.map(person => (
                        <div key={person} className="border-b pb-4">
                            <h4 className="font-bold text-lg mb-3">{person}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Pet:</p>
                                    <div className="flex gap-2">
                                        {pets.map(pet => (
                                            <button
                                                key={pet}
                                                onPointerDown={(e) => {
                                                    e.preventDefault()
                                                    handleCellClick(person, 'pet', pet)
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold transition touch-none select-none ${grid[`${person}-pet`] === pet
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {pet}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">House Color:</p>
                                    <div className="flex gap-2">
                                        {colors.map(color => (
                                            <button
                                                key={color}
                                                onPointerDown={(e) => {
                                                    e.preventDefault()
                                                    handleCellClick(person, 'color', color)
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold transition touch-none select-none ${grid[`${person}-color`] === color
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
