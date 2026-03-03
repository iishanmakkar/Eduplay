'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

interface Task {
    name: string
    duration: number
    emoji: string
}

const TASKS: Task[] = [
    { name: 'Homework', duration: 30, emoji: '📚' },
    { name: 'Play Game', duration: 20, emoji: '🎮' },
    { name: 'Dinner', duration: 25, emoji: '🍽️' },
    { name: 'Reading', duration: 15, emoji: '📖' },
]

interface TimePlannerProps {
    onGameEnd: (
        score: number,
        accuracy: number,
        timeSpent: number,
        difficulty: string
    ) => void
    initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    grade?: GradeBand
}

export default function TimePlannerPuzzle({ onGameEnd, initialDifficulty = 'MEDIUM', grade = '35' }: TimePlannerProps) {
    const [difficulty, setDifficulty] = useState(initialDifficulty)
    const [tasks] = useState(TASKS)
    const [schedule, setSchedule] = useState<Task[]>([])
    const [startTime] = useState(Date.now())
    const [gameOver, setGameOver] = useState(false)

    const bedtime = difficulty === 'EASY' ? 540 : difficulty === 'MEDIUM' ? 480 : 420 // minutes from 6 PM
    const startMinutes = 0

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.dataTransfer.setData('task', JSON.stringify(task))
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const task = JSON.parse(e.dataTransfer.getData('task'))
        if (!schedule.find(t => t.name === task.name)) {
            setSchedule([...schedule, task])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const removeTask = (taskName: string) => {
        setSchedule(schedule.filter(t => t.name !== taskName))
    }

    const getTotalTime = () => {
        return schedule.reduce((sum, task) => sum + task.duration, 0)
    }

    const handleSubmit = () => {
        const totalTime = getTotalTime()
        const isValid = totalTime <= bedtime && schedule.length === tasks.length

        if (isValid) {
            const efficiency = (bedtime - totalTime) / bedtime
            const difficultyMultiplier = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 1.5 : 2
            const score = Math.floor((500 + efficiency * 200) * difficultyMultiplier)

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })

            setGameOver(true)
            const timeSpent = Math.floor((Date.now() - startTime) / 1000)
            onGameEnd(score, 100, timeSpent, difficulty)
        }
    }

    if (gameOver) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[500px] p-8"
            >
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Perfect Planning!</h2>
                <p className="text-lg text-gray-600">All tasks scheduled before bedtime!</p>
            </motion.div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">⏳</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Time Planner Puzzle</h2>
                        <p className="text-sm text-gray-500">Organize tasks before bedtime</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Time Left</div>
                    <div className="text-2xl font-bold text-blue-600">{bedtime - getTotalTime()} min</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Available Tasks */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Available Tasks</h3>
                    <div className="space-y-3">
                        {tasks.filter(t => !schedule.find(s => s.name === t.name)).map((task, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task)}
                                className="p-4 bg-blue-50 rounded-lg cursor-move hover:bg-blue-100 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">{task.emoji}</span>
                                    <div className="text-right">
                                        <div className="font-semibold">{task.name}</div>
                                        <div className="text-sm text-gray-600">{task.duration} min</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Your Schedule</h3>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3"
                    >
                        {schedule.map((task, index) => (
                            <div
                                key={index}
                                className="p-4 bg-green-50 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{task.emoji}</span>
                                    <div>
                                        <div className="font-semibold">{task.name}</div>
                                        <div className="text-sm text-gray-600">{task.duration} min</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeTask(task.name)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={schedule.length !== tasks.length || getTotalTime() > bedtime}
                        className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${schedule.length === tasks.length && getTotalTime() <= bedtime
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Submit Schedule
                    </button>
                </div>
            </div>
        </div>
    )
}
