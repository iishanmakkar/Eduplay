/**
 * Attention Switch - Focus switching challenges
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class AttentionSwitchGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private items = {
        red: ['🔴', '🟥', '❤️', '🍎', '🚗'], // Red items
        blue: ['🔵', '🟦', '💙', '🚙', '💎'], // Blue items
        green: ['🟢', '🟩', '💚', '🍏', '🐸'], // Green items
        yellow: ['🟡', '🟨', '💛', '🍌', '⭐'] // Yellow items
    }

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            // Define a rule
            const colors = ['red', 'blue', 'green', 'yellow']
            const targetColor = colors[Math.floor(this.rng.next() * colors.length)]

            // Task: "Count the [Color] items"
            // Difficulty affects grid size / item count
            const totalItems = difficulty === 'EASY' ? 5 : difficulty === 'MEDIUM' ? 8 : 12

            // Generate Grid
            const grid: string[] = []
            let correctCount = 0

            // Target: 2 to (total - 2)
            const targetCount = Math.floor(this.rng.next() * (totalItems - 3)) + 2 // Ensure at least 2

            // Fill with targets
            const targets = this.items[targetColor as keyof typeof this.items]
            for (let k = 0; k < targetCount; k++) {
                grid.push(targets[Math.floor(this.rng.next() * targets.length)])
                correctCount++
            }

            // Fill rest with distractors (other colors)
            const otherColors = colors.filter(c => c !== targetColor)
            while (grid.length < totalItems) {
                const wrongColor = otherColors[Math.floor(this.rng.next() * otherColors.length)]
                const wrongItems = this.items[wrongColor as keyof typeof this.items]
                grid.push(wrongItems[Math.floor(this.rng.next() * wrongItems.length)])
            }

            // Shuffle grid
            for (let j = grid.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [grid[j], grid[k]] = [grid[k], grid[j]]
            }

            questions.push({
                id: `atten-${Date.now()}-${i}`,
                type: 'attention-switch',
                difficulty,
                content: {
                    task: `Count the ${targetColor.toUpperCase()} items`,
                    items: grid
                },
                correctAnswer: correctCount,
                // Options? Usually attention switch is type-in or multiple choice count
                // If the game component expects multiple choice:
                options: [correctCount, correctCount + 1, correctCount - 1, correctCount + 2].sort(() => Math.random() - 0.5), // Simple MC
                timeLimit: 15,
                points: 10
            })
        }
        return questions
    }
}

export class AttentionSwitchContent {
    static generateContentPool(): ContentPool {
        const generator = new AttentionSwitchGenerator(Date.now())
        return {
            easy: generator.generate(15, 'EASY'),
            medium: generator.generate(15, 'MEDIUM'),
            hard: generator.generate(15, 'HARD'),
            challenge: generator.generate(15, 'HARD')
        }
    }
}
