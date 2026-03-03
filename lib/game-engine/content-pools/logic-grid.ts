/**
 * Logic Grid - Grid-based deduction puzzles
 * Simplifed generation for 3x3 deduction problems
 */

import { Question, ContentPool } from '../content-generator'

export interface LogicGridQuestion extends Question {
    content: {
        clues: string[]
        question: string
        gridSize: number
    }
    options: string[]
    correctAnswer: number
}

export class LogicGridContent {
    static generateContentPool(): ContentPool {
        return {
            easy: this.generateBatch(5, 'EASY'),
            medium: this.generateBatch(5, 'MEDIUM'),
            hard: this.generateBatch(5, 'HARD'),
            challenge: this.generateBatch(5, 'CHALLENGE')
        }
    }

    private static generateBatch(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): LogicGridQuestion[] {
        return Array.from({ length: count }, (_, i) => this.generateQuestion(i, difficulty))
    }

    private static generateQuestion(index: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): LogicGridQuestion {
        const generator = new LogicGridGenerator(difficulty)
        const puzzle = generator.generate()

        return {
            id: `logic-${difficulty.toLowerCase()}-${index}-${Date.now()}`,
            type: 'logic-grid',
            difficulty,
            content: {
                clues: puzzle.clues,
                question: puzzle.question,
                gridSize: 3 // Fixed for now
            },
            options: puzzle.options,
            correctAnswer: puzzle.correctIndex,
            timeLimit: difficulty === 'EASY' ? 45 : 60,
            points: difficulty === 'EASY' ? 20 : 40
        }
    }
}

class LogicGridGenerator {
    private difficulty: string

    constructor(difficulty: string) {
        this.difficulty = difficulty
    }

    generate() {
        // Themes
        const themes = [
            { category: 'Colors', items: ['Red', 'Blue', 'Green', 'Yellow'] },
            { category: 'Pets', items: ['Dog', 'Cat', 'Bird', 'Fish'] },
            { category: 'Hobbies', items: ['Reading', 'Gaming', 'Hiking', 'Cooking'] },
            { category: 'Fruits', items: ['Apple', 'Banana', 'Grape', 'Orange'] },
            { category: 'Sports', items: ['Soccer', 'Tennis', 'Golf', 'Swim'] }
        ]

        const selectedTheme = themes[Math.floor(Math.random() * themes.length)]
        const names = ['Alice', 'Bob', 'Charlie', 'David']

        let gridSize = 3
        if (this.difficulty === 'HARD' || this.difficulty === 'CHALLENGE') {
            gridSize = 4
        }

        // Slice items/names to size
        const activeNames = names.slice(0, gridSize)
        const activeItems = selectedTheme.items.slice(0, gridSize)

        // Create a solution mapping (Random shuffle)
        const shuffledItems = [...activeItems].sort(() => Math.random() - 0.5)
        const solution: Record<string, string> = {}
        activeNames.forEach((name, i) => {
            solution[name] = shuffledItems[i]
        })

        // Generate Clues to reveal the solution strictly
        const clues: string[] = []

        // Always provide 1 Positive Clue to anchor the logic
        const anchorIndex = Math.floor(Math.random() * gridSize)
        clues.push(`${activeNames[anchorIndex]}'s favorite is ${solution[activeNames[anchorIndex]]}.`)

        // Generate Negative clues
        // For 3x3, we need to eliminate options.
        // Each negative clue eliminates 1 cell.
        // A full solver would define the minimal set.
        // Heuristic:
        // For each person (except anchor), give 1-2 negative clues.

        activeNames.forEach((name, i) => {
            if (i === anchorIndex) return

            // Negative clue: "Alice does not like Red"
            // Pick a wrong item that is NOT their true match
            const trueMatch = solution[name]
            const wrongItems = activeItems.filter(item => item !== trueMatch)

            // Pick 1 wrong item to negate
            const negated = wrongItems[Math.floor(Math.random() * wrongItems.length)]
            clues.push(`${name} does NOT like ${negated}.`)

            if (gridSize === 4) {
                // Add another negative clue for 4x4 to make it solvable
                const wrongItems2 = wrongItems.filter(item => item !== negated)
                if (wrongItems2.length > 0) {
                    const negated2 = wrongItems2[0]
                    clues.push(`${name} does NOT like ${negated2}.`)
                }
            }
        })

        // Add a "relational" clue if possible (Shared mismatch?)
        // e.g. "The person who likes Red is not Bob." (Same as Bob != Red)

        // Target question
        // Pick a person who isn't the anchor
        const targetIndices = activeNames.map((_, i) => i).filter(i => i !== anchorIndex)
        const targetIndex = targetIndices[Math.floor(Math.random() * targetIndices.length)]
        const targetPerson = activeNames[targetIndex]
        const correctItem = solution[targetPerson]

        return {
            clues: clues.sort(() => Math.random() - 0.5),
            question: `What is ${targetPerson}'s favorite?`,
            options: this.shuffleOptions(activeItems),
            correctIndex: -1 // Calculated later
        }
    }

    private shuffleOptions(options: string[]) {
        const unique = Array.from(new Set(options)) // Ensure unique
        return unique.sort(() => Math.random() - 0.5)
    }
}
