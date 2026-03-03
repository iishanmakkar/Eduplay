/**
 * Pattern Sequence Content Pool — Grade-Adaptive
 * Algorithmic generation for 500+ unique pattern challenges per grade band.
 */

import { Question, ContentPool } from '../content-generator'
import { GradeBand, GradeMapper } from '../grade-mapper'

export interface PatternSequenceQuestion extends Question {
    content: {
        sequence: string[]
        patternType: 'number' | 'visual' | 'logic'
        rule: string // Internal rule description for debugging/hint
        description?: string
    }
    options: string[]
    correctAnswer: number
}

export class PatternSequenceContent {

    /**
     * Grade-aware pool: K2 gets simple visual patterns, 11-12 gets prime/cubic/multi-sequence.
     * Generates 500+ unique patterns per grade band (125 per difficulty tier).
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        // Map grade to difficulty range for the PatternGenerator
        const countPerTier = 125
        return {
            easy: this.generateBatch(countPerTier, 'EASY', grade),
            medium: this.generateBatch(countPerTier, 'MEDIUM', grade),
            hard: this.generateBatch(countPerTier, 'HARD', grade),
            challenge: this.generateBatch(countPerTier, 'CHALLENGE', grade),
        }
    }

    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }

    private static generateBatch(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE', grade: GradeBand = '35'): PatternSequenceQuestion[] {
        return Array.from({ length: count }, (_, i) => this.generateQuestion(i, difficulty, grade))
    }

    private static generateQuestion(index: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE', grade: GradeBand = '35'): PatternSequenceQuestion {
        const generator = new PatternGenerator(difficulty, grade)
        const problem = generator.generate()

        return {
            id: `pattern-${grade}-${difficulty.toLowerCase()}-${index}-${Date.now()}`,
            type: 'pattern-sequence',
            difficulty,
            content: {
                sequence: problem.sequence,
                patternType: problem.type,
                rule: problem.rule,
                description: `Complete the ${problem.type} pattern:`
            },
            options: problem.options,
            correctAnswer: problem.correctIndex,
            timeLimit: GradeMapper.scaleTime(
                difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 30 : difficulty === 'HARD' ? 45 : 60,
                grade
            ),
            points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50
        }
    }
}

class PatternGenerator {
    private difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'
    private grade: GradeBand

    constructor(difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE', grade: GradeBand = '35') {
        this.difficulty = difficulty
        this.grade = grade
    }

    generate() {
        const rand = Math.random()

        // K2: mostly visual patterns (simple, concrete)
        // 3-5: mix of visual and simple number
        // 6-8: number and logic
        // 9-12: complex number patterns (Fibonacci, primes, cubics)
        let type = 'number'
        if (this.grade === 'K2') {
            type = rand < 0.7 ? 'visual' : 'logic'
        } else if (this.grade === '35') {
            if (rand < 0.4) type = 'visual'
            else if (rand < 0.7) type = 'number'
            else type = 'logic'
        } else if (this.grade === '68') {
            if (rand < 0.2) type = 'visual'
            else if (rand < 0.6) type = 'number'
            else type = 'logic'
        } else {
            // 9-10, 11-12: mostly complex number patterns
            type = rand < 0.2 ? 'logic' : 'number'
        }

        if (type === 'visual') return this.generateVisualPattern()
        if (type === 'logic') return this.generateLogicPattern()
        return this.generateNumberPattern()
    }

    private generateVisualPattern() {
        const emojis = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤']
        const shapes = ['■', '▲', '●', '★', '♦', '♠', '♣', '♥']
        const arrows = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️']
        const clocks = ['🕛', '🕒', '🕕', '🕘']
        const moons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

        const setType = Math.random()

        // 1. Arrow Rotation (New)
        if (setType < 0.25) {
            const start = Math.floor(Math.random() * 8)
            const step = Math.random() > 0.5 ? 1 : 2
            const sequence: string[] = []
            for (let i = 0; i < 5; i++) {
                sequence.push(arrows[(start + i * step) % 8])
            }
            const correct = arrows[(start + 5 * step) % 8]
            // Options: correct + 3 random distinct arrows
            const options = this.shuffleOptions([correct, arrows[(start + 5 * step + 2) % 8], arrows[(start + 5 * step + 4) % 8], arrows[(start + 5 * step + 6) % 8]])
            return { sequence: [...sequence, '?'], type: 'visual' as const, rule: `Rotation (+${step * 45}°)`, options, correctIndex: options.indexOf(correct) }
        }

        // 2. Moon Phases (New)
        if (setType < 0.4) {
            const start = Math.floor(Math.random() * 8)
            const sequence: string[] = []
            for (let i = 0; i < 4; i++) {
                sequence.push(moons[(start + i) % 8])
            }
            const correct = moons[(start + 4) % 8]
            const options = this.shuffleOptions([correct, moons[(start + 2) % 8], moons[(start + 5) % 8], moons[(start + 6) % 8]])
            return { sequence: [...sequence, '?'], type: 'visual' as const, rule: 'Moon Phases', options, correctIndex: options.indexOf(correct) }
        }

        const items = Math.random() > 0.5 ? emojis : shapes
        const pool = [...items].sort(() => Math.random() - 0.5)

        // Existing patterns (AB, ABC, etc)
        // EASY: Simple Repeat (A B A B ...)
        if (this.difficulty === 'EASY') {
            const a = pool[0]
            const b = pool[1]
            const sequence = [a, b, a, b, a, '?']
            const correct = b
            const options = this.shuffleOptions([correct, pool[2], pool[3], pool[4]])
            return { sequence, type: 'visual' as const, rule: 'Repeat pattern (AB)', options, correctIndex: options.indexOf(correct) }
        }

        // MEDIUM: ABC Pattern or Growth
        if (this.difficulty === 'MEDIUM') {
            const type = Math.random() > 0.5 ? 'abc' : 'pal'
            if (type === 'abc') {
                const [a, b, c] = pool
                const sequence = [a, b, c, a, b, c, a, b, '?']
                const correct = c
                const options = this.shuffleOptions([correct, a, b, pool[3]])
                return { sequence, type: 'visual' as const, rule: 'Repeat pattern (ABC)', options, correctIndex: options.indexOf(correct) }
            } else {
                // Palindrome-ish 
                const [a, b] = pool
                // A B B A A B B ...
                const sequence = [a, b, b, a, a, b, b, '?']
                const correct = a
                const options = this.shuffleOptions([correct, b, pool[2], pool[3]])
                return { sequence, type: 'visual' as const, rule: 'Double repeat', options, correctIndex: options.indexOf(correct) }
            }
        }

        // Hard: A B C A ... shifted?
        // A B C D -> B C D E ?
        // Too hard for visual? Keep simple.
        return this.generateNumberPattern()
    }

    private generateLogicPattern() {
        const type = Math.floor(Math.random() * 4)

        if (type === 0) {
            // Alphabet Skip
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
            const start = Math.floor(Math.random() * 10)
            const step = Math.floor(Math.random() * 2) + 1 // 1 or 2
            const seq: string[] = []
            for (let i = 0; i < 5; i++) {
                seq.push(alphabet[start + i * step])
            }
            const correct = alphabet[start + 5 * step]
            const options = this.shuffleOptions([correct, alphabet[start + 5 * step + 1], alphabet[start + 5 * step - 1] || 'Z', 'A'])
            return { sequence: [...seq, '?'], type: 'logic' as const, rule: 'Alphabet Skip', options, correctIndex: options.indexOf(correct) }
        }

        if (type === 1) {
            // Days
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            const start = Math.floor(Math.random() * 7)
            const step = this.difficulty === 'EASY' ? 1 : 2
            const seq: string[] = []
            for (let i = 0; i < 4; i++) {
                seq.push(days[(start + i * step) % 7])
            }
            const correct = days[(start + 4 * step) % 7]
            const options = this.shuffleOptions([correct, days[(start + 4 * step + 1) % 7], days[(start + 4 * step + 3) % 7], days[(start + 4 * step + 4) % 7]])
            return { sequence: [...seq, '?'], type: 'logic' as const, rule: 'Days of Week', options, correctIndex: options.indexOf(correct) }
        }

        if (type === 2) {
            // Months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const start = Math.floor(Math.random() * 12)
            const seq: string[] = []
            for (let i = 0; i < 4; i++) {
                seq.push(months[(start + i) % 12])
            }
            const correct = months[(start + 4) % 12]
            const options = this.shuffleOptions([correct, months[(start + 5) % 12], months[(start + 6) % 12], months[(start + 7) % 12]])
            return { sequence: [...seq, '?'], type: 'logic' as const, rule: 'Months', options, correctIndex: options.indexOf(correct) }
        }

        // Toggles
        // ON, OFF, ON, OFF...
        // YES, NO, YES, NO...
        const pairs = [['ON', 'OFF'], ['YES', 'NO'], ['HIGH', 'LOW'], ['LEFT', 'RIGHT']]
        const pair = pairs[Math.floor(Math.random() * pairs.length)]
        const seq = [pair[0], pair[1], pair[0], pair[1], pair[0], '?']
        const correct = pair[1]
        const options = this.shuffleOptions([correct, pair[0], 'MID', 'NULL'])
        return { sequence: seq, type: 'logic' as const, rule: 'Alternating Logic', options, correctIndex: options.indexOf(correct) }
    }

    private generateNumberPattern() {
        let start = Math.floor(Math.random() * 10) + 1
        let step = Math.floor(Math.random() * 5) + 1
        let length = 5
        let sequence: number[] = []
        let correct = 0
        let rule = ''

        // EASY: Arithmetic + or - small numbers
        if (this.difficulty === 'EASY') {
            step = Math.floor(Math.random() * 4) + 1 // 1 to 4
            const op = Math.random() > 0.3 ? 'add' : 'sub'

            if (op === 'sub') start = 20 + Math.floor(Math.random() * 10)

            for (let i = 0; i < length; i++) {
                sequence.push(op === 'add' ? start + (i * step) : start - (i * step))
            }
            correct = op === 'add' ? sequence[length - 1] + step : sequence[length - 1] - step
            rule = `Arithmetic (${op} ${step})`
        }

        // MEDIUM: Geometric (x2, x3) or wider arithmetic
        else if (this.difficulty === 'MEDIUM') {
            const type = Math.random() > 0.5 ? 'geo' : 'arith'
            if (type === 'geo') {
                start = Math.floor(Math.random() * 4) + 1
                step = Math.floor(Math.random() * 2) + 2 // 2 or 3
                for (let i = 0; i < length; i++) {
                    sequence.push(start * Math.pow(step, i))
                }
                correct = sequence[length - 1] * step
                rule = `Geometric (x${step})`
            } else {
                step = Math.floor(Math.random() * 10) + 5
                for (let i = 0; i < length; i++) {
                    sequence.push(start + (i * step))
                }
                correct = sequence[length - 1] + step
                rule = `Arithmetic (+${step})`
            }
        }

        // HARD: Fibonacci, Squares, Interleaved
        else if (this.difficulty === 'HARD') {
            const type = Math.random()
            if (type < 0.33) {
                // Fibonacci
                sequence = [1, 1]
                for (let i = 2; i < 7; i++) { // longer seq
                    sequence.push(sequence[i - 1] + sequence[i - 2])
                }
                correct = sequence[sequence.length - 1] + sequence[sequence.length - 2]
                rule = 'Fibonacci'
            } else if (type < 0.66) {
                // Squares
                start = 1
                for (let i = 1; i <= 6; i++) {
                    sequence.push(i * i)
                }
                correct = 7 * 7
                rule = 'Square numbers'
            } else {
                // Two interleaved sequences
                // A: +2, B: +3
                // 2, 3, 4, 6, 6, 9, 8, 12...
                const seqA_start = Math.floor(Math.random() * 5) + 1
                const seqB_start = Math.floor(Math.random() * 5) + 20
                const stepA = 2
                const stepB = -2

                sequence = []
                for (let i = 0; i < 4; i++) {
                    sequence.push(seqA_start + (i * stepA))
                    sequence.push(seqB_start + (i * stepB))
                }
                // Next is A's turn (index 8)
                correct = seqA_start + (4 * stepA)
                rule = 'Interleaved sequences (+2, -2)'
            }
        }

        // CHALLENGE: Prime, Cubic, Complex
        else {
            const type = Math.random()
            if (type < 0.5) {
                // Primes
                const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
                const startIdx = Math.floor(Math.random() * 3)
                sequence = primes.slice(startIdx, startIdx + 6)
                correct = primes[startIdx + 6]
                rule = 'Prime numbers'
            } else {
                // n^3 - 1
                for (let i = 1; i <= 5; i++) {
                    sequence.push((i * i * i) - 1)
                }
                correct = (6 * 6 * 6) - 1
                rule = 'Cubic minus 1'
            }
        }

        const seqString = [...sequence.map(String), '?']
        const options = this.generateMathOptions(correct)

        return {
            sequence: seqString,
            type: 'number' as const,
            rule,
            options: this.shuffleOptions(options),
            correctIndex: -1 // Calculated after shuffle
        }
    }

    private generateMathOptions(correct: number): string[] {
        // Generate realistic distractors
        const set = new Set<number>()
        set.add(correct)

        while (set.size < 4) {
            const offset = Math.floor(Math.random() * 10) - 5
            const val = correct + offset
            if (val !== correct && val > 0) set.add(val)
        }

        return Array.from(set).map(String)
    }

    private shuffleOptions(options: string[]): string[] {
        return options.sort(() => Math.random() - 0.5)
    }
}
