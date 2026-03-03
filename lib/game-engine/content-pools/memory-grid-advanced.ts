/**
 * Memory Grid Advanced - Multi-level memory recall
 */

import { Question, ContentPool } from '../content-generator'

export interface MemoryGridQuestion extends Question {
    content: {
        items: string[]
        gridSize: 3 | 4
        displayTime: number
    }
    correctAnswer: string[]
}

export class MemoryGridContent {
    static generateContentPool(): ContentPool {
        const easy: MemoryGridQuestion[] = [
            {
                id: 'memgrid-1',
                type: 'memory-grid',
                difficulty: 'EASY',
                content: {
                    items: ['🍎', '🍊', '🍋'],
                    gridSize: 3,
                    displayTime: 3000
                },
                correctAnswer: ['🍎', '🍊', '🍋'],
                timeLimit: 30,
                points: 10
            }
        ]
        return { easy, medium: easy, hard: easy, challenge: easy }
    }
}
