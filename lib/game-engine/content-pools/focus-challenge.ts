/**
 * Focus Challenge Content Pool
 * Attention and distraction filtering
 */

import { Question, ContentPool } from '../content-generator'

export interface FocusChallengeQuestion extends Question {
    content: {
        targetEmoji: string
        distractors: string[]
        gridSize: 4 | 5 | 6
        targetCount: number
    }
    correctAnswer: number
}

export class FocusChallengeContent {
    static generateContentPool(): ContentPool {
        return {
            easy: this.generateChallenges(4, 3, ['🔴', '🔵', '🟢']),
            medium: this.generateChallenges(5, 4, ['⭐', '🌟', '✨', '💫']),
            hard: this.generateChallenges(6, 5, ['🎯', '🎪', '🎨', '🎭', '🎬']),
            challenge: this.generateChallenges(6, 6, ['🦁', '🐯', '🐻', '🦊', '🐺', '🦝'])
        }
    }

    private static generateChallenges(
        gridSize: 4 | 5 | 6,
        distractorCount: number,
        emojiSet: string[]
    ): FocusChallengeQuestion[] {
        const challenges: FocusChallengeQuestion[] = []

        for (let i = 0; i < 10; i++) {
            const targetEmoji = emojiSet[0]
            const distractors = emojiSet.slice(1, distractorCount + 1)
            const totalCells = gridSize * gridSize
            const targetCount = Math.floor(totalCells * 0.3) + Math.floor(Math.random() * 3)

            const difficulty = gridSize === 4 ? 'EASY' : gridSize === 5 ? 'MEDIUM' : gridSize === 6 ? 'HARD' : 'CHALLENGE'
            const points = gridSize === 4 ? 10 : gridSize === 5 ? 20 : gridSize === 6 ? 30 : 50

            challenges.push({
                id: `focus-${gridSize}x${gridSize}-${i}`,
                type: 'focus-challenge',
                difficulty: difficulty as any,
                content: {
                    targetEmoji,
                    distractors,
                    gridSize,
                    targetCount
                },
                correctAnswer: targetCount,
                timeLimit: gridSize === 4 ? 10 : gridSize === 5 ? 8 : 6,
                points
            })
        }

        return challenges
    }

    static generateGrid(question: FocusChallengeQuestion): string[] {
        const { gridSize, targetEmoji, distractors, targetCount } = question.content
        const totalCells = gridSize * gridSize
        const grid: string[] = []

        // Add targets
        for (let i = 0; i < targetCount; i++) {
            grid.push(targetEmoji)
        }

        // Fill rest with distractors
        while (grid.length < totalCells) {
            const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)]
            grid.push(randomDistractor)
        }

        // Shuffle
        for (let i = grid.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [grid[i], grid[j]] = [grid[j], grid[i]]
        }

        return grid
    }
}
