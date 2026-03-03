/**
 * Math Grid - Number puzzle challenges
 */

import { Question, ContentPool } from '../content-generator'

export interface MathGridQuestion extends Question {
    content: {
        grid: number[][]
        target: number
        operation: '+' | '-' | '*' | '/'
    }
    correctAnswer: number
}

export class MathGridContent {
    static generateContentPool(): ContentPool {
        const generateQuestions = (count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): MathGridQuestion[] => {
            return Array.from({ length: count }, (_, i) => {
                const gridSize = difficulty === 'EASY' ? 2 : difficulty === 'MEDIUM' ? 3 : 3
                const minVal = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : 5
                const maxVal = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 50

                // Generate grid
                const grid: number[][] = []
                let sum = 0

                for (let r = 0; r < gridSize; r++) {
                    const row: number[] = []
                    for (let c = 0; c < gridSize; c++) {
                        const val = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
                        row.push(val)
                        sum += val
                    }
                    grid.push(row)
                }

                return {
                    id: `mathgrid-${difficulty}-${i}`,
                    type: 'math-grid',
                    difficulty,
                    content: {
                        grid,
                        target: sum,
                        operation: '+'
                    },
                    correctAnswer: sum,
                    timeLimit: difficulty === 'EASY' ? 30 : 60,
                    points: difficulty === 'EASY' ? 10 : 20
                }
            })
        }

        return {
            easy: generateQuestions(20, 'EASY'),
            medium: generateQuestions(20, 'MEDIUM'),
            hard: generateQuestions(20, 'HARD'),
            challenge: generateQuestions(20, 'CHALLENGE')
        }
    }
}
