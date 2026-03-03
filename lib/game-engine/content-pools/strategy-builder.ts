/**
 * Strategy Builder - Simple planning challenges
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class StrategyBuilderGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            // Generate a budget problem
            // Budget: $10 - $50
            const budget = (this.rng.nextInt(2, 10)) * 5

            // Items
            const items = [
                { n: 'Toy', c: this.rng.nextInt(3, 8) },
                { n: 'Book', c: this.rng.nextInt(4, 10) },
                { n: 'Snack', c: this.rng.nextInt(2, 5) },
                { n: 'Game', c: this.rng.nextInt(10, 20) },
                { n: 'Hat', c: this.rng.nextInt(5, 12) }
            ]

            // Pick 3 items
            const selection = this.rng.pickN(items, 3)

            // Create options
            // 1. Affordable bundle
            // 2. Too expensive bundle
            // 3. Another affordable
            // 4. Another expensive

            const combinations = [
                { items: [selection[0], selection[1]], cost: selection[0].c + selection[1].c },
                { items: [selection[1], selection[2]], cost: selection[1].c + selection[2].c },
                { items: [selection[0], selection[2]], cost: selection[0].c + selection[2].c },
                { items: [selection[0], selection[1], selection[2]], cost: selection[0].c + selection[1].c + selection[2].c }
            ]

            // Filter finding which are affordable
            const affordable = combinations.filter(c => c.cost <= budget)
            const expensive = combinations.filter(c => c.cost > budget)

            // If no expensive options, adjust budget down or skip
            // If no affordable options, adjust budget up
            // To simplify, we'll force a scenario:

            // Valid Question: "Which can you afford?"
            // OR "You want to save the most money. Which do you buy?"
            // OR "You want the most items. Which do you buy?"

            // Let's go with "Which combination can you buy with $X?"
            // Correct answer is the one <= budget (and maybe closest to budget?)
            // Or simple single-selection: "Can you buy X and Y?" -> Yes/No. 
            // Better: "You have $X. Select the best purchase to maximize items."

            // Simplified Approach for Consistency:
            // "You have $X. Can you afford [Item A] ($P) and [Item B] ($Q)?"
            // Options: "Yes", "No, short by $Z", "No, short by $W"

            const targetItems = [selection[0], selection[1]]
            const targetCost = targetItems[0].c + targetItems[1].c
            const canAfford = targetCost <= budget

            let options: string[] = []
            let correctAnswerStr = ''

            if (canAfford) {
                const diff = budget - targetCost
                correctAnswerStr = `Yes, you will have $${diff} left`
                options = [
                    correctAnswerStr,
                    `No, you need $${this.rng.nextInt(1, 5)} more`,
                    `Yes, you will have $${diff + 5} left`,
                    `No, exact change only`
                ]
            } else {
                const diff = targetCost - budget
                correctAnswerStr = `No, you need $${diff} more`
                options = [
                    correctAnswerStr,
                    `Yes, you will have $${this.rng.nextInt(1, 5)} left`,
                    `No, you need $${diff + 5} more`,
                    `Yes, exactly`
                ]
            }

            // Shuffle options
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `strat-${Date.now()}-${i}`,
                type: 'strategy',
                difficulty,
                content: {
                    scenario: `You have $${budget}. You want to buy a ${targetItems[0].n} ($${targetItems[0].c}) and a ${targetItems[1].n} ($${targetItems[1].c}).`,
                    goal: 'Can you afford them?',
                    bestStrategy: 0, // Ignored logic, using correct Answer index
                    options: [] // Filled below
                },
                options,
                correctAnswer: options.indexOf(correctAnswerStr),
                timeLimit: 30,
                points: 15
            })
        }
        return questions
    }
}

export class StrategyBuilderContent {
    static generateContentPool(): ContentPool {
        const generator = new StrategyBuilderGenerator(Date.now())
        return {
            easy: generator.generate(15, 'EASY'),
            medium: generator.generate(15, 'MEDIUM'),
            hard: generator.generate(15, 'HARD'),
            challenge: generator.generate(15, 'HARD')
        }
    }
}
