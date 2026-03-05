
import { useState, useEffect, useRef } from 'react'
import { SudokuGenerator } from '@/lib/game-engine/sudoku-generator'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GradeBand } from '@/lib/game-engine/grade-mapper'

type GridSize = 4 | 6

interface MathGridSudokuProps {
    onGameEnd: (
        score: number,
        accuracy: number,
        timeSpent: number,
        difficulty: string,
        reactionTime?: number,
        hintsUsed?: number,
        mistakes?: number
    ) => void
    initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    grade?: GradeBand
}

export default function MathGridSudoku({ onGameEnd, initialDifficulty = 'MEDIUM', grade = '35' }: MathGridSudokuProps) {
    const [difficulty, setDifficulty] = useState(initialDifficulty)
    const gridSize: GridSize = difficulty === 'EASY' ? 4 : 6

    const [grid, setGrid] = useState<(number | null)[][]>([])
    const [solution, setSolution] = useState<number[][]>([])
    const [mistakes, setMistakes] = useState(0)
    const [startTime] = useState(Date.now())
    const [gameOver, setGameOver] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null)
    const generatePuzzle = (diff: string = difficulty) => {
        const { grid, solution } = SudokuGenerator.generate(gridSize, diff)
        const newGrid = grid.map(row => row.map(cell => ({
            value: cell === 0 ? null : cell,
            isFixed: cell !== 0,
            isError: false
        })))

        // Convert solution to match component's expected format (number[][])
        // The generator returns number[][], which is what we need.
        setSolution(solution)

        // Convert grid to component's expected format ((number | null)[][])
        // The generator returns 0 for empty cells.
        const componentGrid = grid.map(row => row.map(cell => cell === 0 ? null : cell))
        setGrid(componentGrid)
    }

    const isSubmitting = useRef(false) // Lock

    // Initialize puzzle on mount and re-generate when difficulty changes
    useEffect(() => {
        isSubmitting.current = false
        setGameOver(false)
        setMistakes(0)
        setSelectedCell(null)
        generatePuzzle(difficulty)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty])

    const handleCellChange = (row: number, col: number, value: string) => {
        if (gameOver || isSubmitting.current) return

        if (value && !/^[1-9]$/.test(value)) return
        if (value && parseInt(value) > gridSize) return

        const newGrid = grid.map(r => [...r])
        newGrid[row][col] = value ? parseInt(value) : null

        // Check if correct
        if (value && parseInt(value) !== solution[row][col]) {
            setMistakes(prev => prev + 1)
        }

        setGrid(newGrid)

        // Check if completed
        if (newGrid.every(row => row.every(cell => cell !== null))) {
            isSubmitting.current = true
            checkSolution(newGrid)
        }
    }

    // Placeholder for checkSolution function
    const checkSolution = (currentGrid: (number | null)[][]) => {
        // Implement your solution checking logic here
        // For now, let's just simulate a win
        setTimeout(() => {
            setGameOver(true)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            const timeSpent = Math.floor((Date.now() - startTime) / 1000)
            onGameEnd(100, 100, timeSpent, difficulty, undefined, undefined, mistakes)
        }, 1000)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-gray-800 mb-8"
            >
                Math Grid Sudoku
            </motion.h1>

            <div className="bg-white p-6 rounded-lg shadow-xl">
                {/* Grid */}
                <div
                    className="grid gap-1 mx-auto mb-8"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                        maxWidth: `${gridSize * 60}px`
                    }}
                >
                    {grid.map((row, i) =>
                        row.map((cell, j) => (
                            <button
                                key={`${i}-${j}`}
                                onClick={() => {
                                    if (solution[i][j] !== null && grid[i][j] !== null && cell === solution[i][j]) return // Fixed cells
                                    setSelectedCell({ row: i, col: j })
                                }}
                                className={`w-14 h-14 text-center text-xl font-bold border-2 rounded transition-all ${selectedCell?.row === i && selectedCell?.col === j
                                    ? 'border-blue-500 ring-2 ring-blue-200 z-10'
                                    : solution[i][j] === cell
                                        ? 'border-gray-300 bg-white'
                                        : cell !== null
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                {cell || ''}
                            </button>
                        ))
                    )}
                </div>

                {/* Number Pad */}
                <div className="max-w-md mx-auto">
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: gridSize }).map((_, i) => (
                            <button
                                key={i + 1}
                                onPointerDown={(e) => {
                                    e.preventDefault()
                                    if (selectedCell) {
                                        handleCellChange(selectedCell.row, selectedCell.col, (i + 1).toString())
                                    }
                                }}
                                disabled={!selectedCell || gameOver}
                                className="h-12 text-lg font-bold bg-white border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-200 transition-all shadow-sm touch-none select-none"
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onPointerDown={(e) => {
                                e.preventDefault()
                                if (selectedCell) {
                                    handleCellChange(selectedCell.row, selectedCell.col, '')
                                }
                            }}
                            disabled={!selectedCell || gameOver}
                            className="h-12 text-lg font-bold bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all shadow-sm touch-none select-none"
                        >
                            ⌫
                        </button>
                    </div>
                    <div className="text-center mt-4 text-sm text-gray-500">
                        {selectedCell ? 'Tap a number to fill' : 'Tap a cell to select it'}
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Fill each row and column with numbers 1-{gridSize}</p>
                    <p>No repeats allowed!</p>
                </div>
            </div >
        </div >
    )
}
