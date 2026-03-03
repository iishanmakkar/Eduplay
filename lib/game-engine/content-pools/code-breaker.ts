/**
 * Code Breaker - Pattern decoding challenges
 * Algorithmic generation for substitution and math logic puzzles
 */

import { Question, ContentPool } from '../content-generator'

export interface CodeBreakerQuestion extends Question {
    content: {
        code: string
        pattern: string
        hint: string
    }
    options: string[]
    correctAnswer: number
}

export class CodeBreakerContent {
    static generateContentPool(): ContentPool {
        return {
            easy: this.generateBatch(10, 'EASY'),
            medium: this.generateBatch(10, 'MEDIUM'),
            hard: this.generateBatch(10, 'HARD'),
            challenge: this.generateBatch(5, 'CHALLENGE')
        }
    }

    private static generateBatch(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): CodeBreakerQuestion[] {
        return Array.from({ length: count }, (_, i) => this.generateQuestion(i, difficulty))
    }

    private static generateQuestion(index: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): CodeBreakerQuestion {
        const generator = new CodeBreakerGenerator(difficulty)
        const puzzle = generator.generate()

        return {
            id: `code-${difficulty.toLowerCase()}-${index}-${Date.now()}`,
            type: 'code-breaker',
            difficulty,
            content: {
                code: puzzle.code,
                pattern: puzzle.question,
                hint: puzzle.hint
            },
            options: puzzle.options,
            correctAnswer: puzzle.correctIndex,
            timeLimit: difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 30 : difficulty === 'HARD' ? 45 : 60,
            points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50
        }
    }
}

class CodeBreakerGenerator {
    private difficulty: string

    constructor(difficulty: string) {
        this.difficulty = difficulty
    }

    generate() {
        // Randomly choose puzzle type based on difficulty attributes
        const type = Math.random()

        if (this.difficulty === 'EASY') {
            // Simple Symbol Math or A=1 B=2 direct substitution
            return type > 0.5 ? this.generateSymbolMath() : this.generateDirectSubstitution()
        } else if (this.difficulty === 'MEDIUM') {
            // Variable manipulation or Reverse Alphabet
            return type > 0.5 ? this.generateSymbolMath(3) : this.generateReverseSubstitution()
        } else {
            // Hard/Challenge: Complex formulas or Shift Ciphers
            return this.generateCipherLogic()
        }
    }

    // 🔴 + 🔵 = 5 type puzzles
    private generateSymbolMath(vars = 2) {
        const symbols = ['🔴', '🔵', '🟢', '🟡', '🟣', '🔶']
        const values: Record<string, number> = {}
        const usedSymbols: string[] = []

        // Assign random values 1-9
        for (let i = 0; i < vars; i++) {
            const sym = symbols[i]
            values[sym] = Math.floor(Math.random() * 9) + 1
            usedSymbols.push(sym)
        }

        // Generate the "Clue" string: "🔴=5, 🔵=3"
        const code = usedSymbols.map(s => `${s}=${values[s]}`).join(', ')

        // Generate the question equation: "🔴 + 🔵 = ?"
        // Random operation
        const op = Math.random() > 0.5 ? '+' : (this.difficulty === 'EASY' ? '+' : '×')

        let val = 0
        if (op === '+') {
            val = values[usedSymbols[0]] + values[usedSymbols[1]]
        } else {
            val = values[usedSymbols[0]] * values[usedSymbols[1]]
        }

        const question = `${usedSymbols[0]} ${op} ${usedSymbols[1]} = ?`

        return {
            code,
            question,
            hint: op === '+' ? 'Add the values' : 'Multiply the values',
            options: this.generateOptions(val),
            correctIndex: -1 // Calculated after shuffle
        }
    }

    // A=1, B=2 ... CAB=?
    private generateDirectSubstitution() {
        const word = ['CAB', 'BAD', 'DAD', 'ACE', 'BED', 'FED'][Math.floor(Math.random() * 6)]
        // Provide mapping for letters in word
        const uniqueChars = Array.from(new Set(word.split('')))
        const mapping: Record<string, number> = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6
        }

        const code = uniqueChars.map(c => `${c}=${mapping[c]}`).join(', ')

        // Calculate sum
        let sum = 0
        for (const char of word) {
            sum += mapping[char]
        }

        return {
            code,
            question: `${word} = ? (Sum)`,
            hint: 'A=1, B=2, C=3...',
            options: this.generateOptions(sum),
            correctIndex: -1
        }
    }

    // Z=1 (Reverse)
    private generateReverseSubstitution() {
        const word = ['CAT', 'DOG', 'BAT', 'SUN'][Math.floor(Math.random() * 4)]
        // A=26, B=25...
        // Just give Clue A=26, Z=1

        const code = 'A=26, Z=1'
        let sum = 0

        for (const char of word) {
            const val = 26 - (char.charCodeAt(0) - 65)
            sum += val
        }

        return {
            code,
            question: `${word} = ? (Sum)`,
            hint: 'Reverse alphabet values',
            options: this.generateOptions(sum),
            correctIndex: -1
        }
    }

    // Pattern Logic: If 2=4, 3=9, 4=16... 5=?
    private generateCipherLogic() {
        const start = Math.floor(Math.random() * 3) + 2 // 2, 3, 4

        // Rules: square, double+1, times 3
        const rules = [
            { name: 'Square', fn: (n: number) => n * n, hint: 'n × n' },
            { name: 'Double plus 1', fn: (n: number) => (n * 2) + 1, hint: '2n + 1' },
            { name: 'Triple', fn: (n: number) => n * 3, hint: 'n × 3' }
        ]

        const rule = rules[Math.floor(Math.random() * rules.length)]

        // Generate sequence "2=4, 3=9, 4=16"
        const seq = []
        for (let i = 0; i < 3; i++) {
            const n = start + i
            seq.push(`${n} → ${rule.fn(n)}`)
        }

        const target = start + 3
        const answer = rule.fn(target)

        return {
            code: seq.join(', '),
            question: `${target} → ?`,
            hint: 'Find the math rule',
            options: this.generateOptions(answer),
            correctIndex: -1
        }
    }

    private generateOptions(correct: number): string[] {
        const set = new Set<string>()
        set.add(String(correct))
        while (set.size < 4) {
            const val = correct + Math.floor(Math.random() * 10) - 5
            if (val !== correct && val > 0) set.add(String(val))
        }
        return Array.from(set).sort(() => Math.random() - 0.5)
    }
}
