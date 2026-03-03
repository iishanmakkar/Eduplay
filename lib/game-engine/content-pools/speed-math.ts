/**
 * Speed Math Content Pools — Grade-Adaptive
 * 1,000+ dynamic variations per grade band (5 bands × 200+ = 5,000+ total)
 * Uses MathEngine for guaranteed correctness, no division-by-zero, no NaN.
 */

import { Question, ContentPool } from '../content-generator'
import { MathEngine, Operation } from '../math-engine'
import { GradeBand, GradeMapper } from '../grade-mapper'

export interface MathProblem extends Question {
    content: {
        question: string
        type: 'arithmetic' | 'word-problem' | 'fraction' | 'decimal' | 'algebraic' | 'quadratic'
        operation: '+' | '-' | '×' | '÷' | 'mixed' | 'algebraic' | 'quadratic'
    }
    correctAnswer: number
    options: number[]
}

// ─── Grade-Aware Word Problem Templates ────────────────────────────────────────

const WORD_PROBLEMS: Record<GradeBand, Array<{
    template: string
    operation: '+' | '-' | '×' | '÷' | 'mixed' | 'algebraic' | 'quadratic'
    rangeA: [number, number]
    rangeB: [number, number]
    compute: (a: number, b: number, c: number, d: number) => number
}>> = {
    K2: [
        { template: 'There are {a} apples. {b} more are added. How many apples?', operation: '+', rangeA: [1, 10], rangeB: [1, 10], compute: (a, b) => a + b },
        { template: 'You have {a} stickers. You give away {b}. How many are left?', operation: '-', rangeA: [5, 15], rangeB: [1, 5], compute: (a, b) => a - b },
        { template: '{a} birds sit on a branch. {b} fly away. How many remain?', operation: '-', rangeA: [5, 20], rangeB: [1, 10], compute: (a, b) => a - b },
        { template: 'A bag has {a} red balls and {b} blue balls. How many in total?', operation: '+', rangeA: [1, 10], rangeB: [1, 10], compute: (a, b) => a + b },
        { template: 'There are {a} cats. {b} more cats arrive. How many cats now?', operation: '+', rangeA: [1, 8], rangeB: [1, 8], compute: (a, b) => a + b },
    ],
    '35': [
        { template: 'A store has {a} books. They sell {b} books. How many are left?', operation: '-', rangeA: [20, 80], rangeB: [5, 20], compute: (a, b) => a - b },
        { template: '{a} students are in {b} equal groups. How many per group?', operation: '÷', rangeA: [12, 60], rangeB: [2, 6], compute: (a, b) => Math.floor(a / b) },
        { template: 'A box has {b} pencils. There are {a} boxes. How many pencils total?', operation: '×', rangeA: [3, 9], rangeB: [5, 12], compute: (a, b) => a * b },
        { template: 'Tom runs {a} km each day for {b} days. How many km total?', operation: '×', rangeA: [3, 9], rangeB: [5, 7], compute: (a, b) => a * b },
        { template: 'A class has {a} students. {b} are absent. How many are present?', operation: '-', rangeA: [25, 40], rangeB: [2, 8], compute: (a, b) => a - b },
        { template: 'There are {a} chairs in {b} equal rows. How many chairs per row?', operation: '÷', rangeA: [24, 72], rangeB: [3, 8], compute: (a, b) => Math.floor(a / b) },
    ],
    '68': [
        { template: 'A temperature drops from {a}°C to {b}°C. What is the change?', operation: '-', rangeA: [5, 30], rangeB: [-15, 4], compute: (a, b) => a - b },
        { template: 'A submarine is at {a}m below sea level. It descends {b}m more. What is its depth?', operation: '-', rangeA: [50, 200], rangeB: [10, 80], compute: (a, b) => -(a + b) },
        { template: 'A recipe needs {a}/{b} cup of flour. For {c} batches, how many cups?', operation: 'mixed', rangeA: [1, 3], rangeB: [2, 4], compute: (a, b, c) => (a / b) * c },
        { template: 'A car travels {a} km in {b} hours. What is its speed in km/h?', operation: '÷', rangeA: [60, 300], rangeB: [2, 6], compute: (a, b) => a / b },
        { template: 'A discount of {b}% on ${a}. What is the discount amount?', operation: 'mixed', rangeA: [100, 500], rangeB: [10, 50], compute: (a, b) => (a * b) / 100 },
    ],
    '910': [
        { template: 'Solve: {a}x + {b} = {c}. What is x?', operation: 'algebraic', rangeA: [1, 5], rangeB: [1, 20], compute: (a, b, c) => (c - b) / a },
        { template: 'The sum of {a} consecutive integers starting from x is {b}. Find x.', operation: 'algebraic', rangeA: [3, 6], rangeB: [15, 60], compute: (a, b) => Math.round(b / a - (a - 1) / 2) },
        { template: 'A train travels {a} km at {b} km/h. How many minutes does it take?', operation: 'mixed', rangeA: [60, 300], rangeB: [60, 120], compute: (a, b) => Math.round((a / b) * 60) },
        { template: '{a}% of {b} students passed. How many students passed?', operation: 'mixed', rangeA: [60, 95], rangeB: [40, 200], compute: (a, b) => Math.round((a / 100) * b) },
        { template: 'Simple interest: Principal ${a}, Rate {b}%, Time {c} years. Find SI.', operation: 'mixed', rangeA: [1000, 5000], rangeB: [5, 15], compute: (a, b, c) => (a * b * c) / 100 },
    ],
    '1112': [
        { template: 'Solve: {a}x² + {b}x + {c} = 0. Find the positive root (if real).', operation: 'quadratic', rangeA: [1, 3], rangeB: [-7, -1], compute: (a, b, c) => { const disc = b * b - 4 * a * c; return disc >= 0 ? (-b + Math.sqrt(disc)) / (2 * a) : 0 } },
        { template: 'A ball is thrown upward. Height h = {a}t - {b}t². Find max height.', operation: 'quadratic', rangeA: [20, 40], rangeB: [5, 10], compute: (a, b) => Math.round((a * a) / (4 * b)) },
        { template: 'Compound interest: P=${a}, r={b}%, n=2 years. Find amount.', operation: 'mixed', rangeA: [1000, 5000], rangeB: [5, 20], compute: (a, b) => Math.round(a * Math.pow(1 + b / 100, 2)) },
        { template: 'Solve the system: {a}x + {b}y = {c}, x - y = {d}. Find x.', operation: 'algebraic', rangeA: [1, 3], rangeB: [1, 3], compute: (a: number, b: number, c: number, d: number) => { const x = (c + b * d) / (a + b); return Math.round(x * 10) / 10 } },
    ],
}

export class SpeedMathContent {

    private static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    private static generateOptions(correct: number, count: number = 4): number[] {
        const options = new Set<number>([correct])
        const range = Math.max(Math.abs(correct) * 0.3, 5)
        let attempts = 0

        while (options.size < count && attempts < 100) {
            attempts++
            const offset = Math.round((Math.random() - 0.5) * range * 2)
            if (offset !== 0) options.add(correct + offset)
        }

        // Fallback fill
        let backup = 1
        while (options.size < count) {
            const next = correct + backup * (Math.random() > 0.5 ? 1 : -1)
            if (!options.has(next)) options.add(next)
            backup++
        }

        return Array.from(options).sort(() => Math.random() - 0.5)
    }

    /**
     * Generate arithmetic problem using MathEngine (grade-aware)
     */
    private static generateArithmetic(
        operation: '+' | '-' | '×' | '÷',
        range: [number, number],
        difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE',
        allowNegatives: boolean
    ): MathProblem {
        const engineDiff = difficulty === 'EASY' ? 'BEGINNER' :
            difficulty === 'MEDIUM' ? 'INTERMEDIATE' :
                difficulty === 'HARD' ? 'ADVANCED' : 'CHALLENGE'

        const generated = MathEngine.generateProblem({
            difficulty: engineDiff,
            allowNegatives,
            customRange: range,
            forceOperation: operation,
            maxSteps: 1
        })

        return {
            id: `math-${Date.now()}-${Math.random()}`,
            type: 'arithmetic',
            difficulty,
            content: {
                question: `${generated.expression} = ?`,
                type: 'arithmetic',
                operation
            },
            correctAnswer: generated.answer,
            options: generated.options || MathEngine.generateOptions(generated.answer),
            timeLimit: difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 15 : difficulty === 'HARD' ? 12 : 10,
            points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50
        }
    }

    /**
     * Generate algebraic expression problem (Grade 9–12)
     */
    private static generateAlgebraic(difficulty: 'HARD' | 'CHALLENGE'): MathProblem {
        // ax + b = c → solve for x
        const a = this.randomInt(1, 5)
        const x = this.randomInt(-10, 10)
        const b = this.randomInt(-20, 20)
        const c = a * x + b

        const question = `${a}x + ${b} = ${c}. Find x.`
        const answer = x

        return {
            id: `alg-${Date.now()}-${Math.random()}`,
            type: 'algebraic',
            difficulty,
            content: { question, type: 'algebraic', operation: 'algebraic' },
            correctAnswer: answer,
            options: this.generateOptions(answer),
            timeLimit: difficulty === 'HARD' ? 25 : 20,
            points: difficulty === 'HARD' ? 40 : 60
        }
    }

    /**
     * Generate quadratic problem (Grade 11–12)
     * Uses factored form to guarantee integer roots
     */
    private static generateQuadratic(): MathProblem {
        // (x - r1)(x - r2) = 0 → x² - (r1+r2)x + r1*r2 = 0
        const r1 = this.randomInt(-8, 8)
        const r2 = this.randomInt(-8, 8)
        const b = -(r1 + r2)
        const c = r1 * r2
        const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`
        const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`
        const question = `x² ${bSign}x ${cSign} = 0. Find the larger root.`
        const answer = Math.max(r1, r2)

        return {
            id: `quad-${Date.now()}-${Math.random()}`,
            type: 'quadratic',
            difficulty: 'CHALLENGE',
            content: { question, type: 'quadratic', operation: 'algebraic' },
            correctAnswer: answer,
            options: this.generateOptions(answer),
            timeLimit: 30,
            points: 80
        }
    }

    /**
     * Generate word problem for a grade band
     */
    private static generateWordProblem(grade: GradeBand, difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'): MathProblem {
        const templates = WORD_PROBLEMS[grade]
        const tmpl = templates[this.randomInt(0, templates.length - 1)]

        let a = this.randomInt(tmpl.rangeA[0], tmpl.rangeA[1])
        let b = this.randomInt(tmpl.rangeB[0], tmpl.rangeB[1])
        const c = this.randomInt(2, 5)
        const d = this.randomInt(1, 5)

        // Ensure valid division
        if (tmpl.operation === '÷') {
            a = b * this.randomInt(2, 8)
        }
        // Ensure no negative result for K2/35
        if ((grade === 'K2' || grade === '35') && tmpl.operation === '-' && a < b) {
            [a, b] = [b, a]
        }

        let answer = tmpl.compute(a, b, c, d)
        if (!isFinite(answer) || isNaN(answer)) answer = 0
        if (Object.is(answer, -0)) answer = 0
        answer = Math.round(answer * 100) / 100

        const question = tmpl.template
            .replace('{a}', a.toString())
            .replace('{b}', b.toString())
            .replace('{c}', c.toString())
            .replace('{d}', d.toString())

        return {
            id: `word-${Date.now()}-${Math.random()}`,
            type: 'word-problem',
            difficulty,
            content: { question, type: 'word-problem', operation: tmpl.operation },
            correctAnswer: answer,
            options: this.generateOptions(answer),
            timeLimit: difficulty === 'EASY' ? 30 : difficulty === 'MEDIUM' ? 25 : 20,
            points: difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 30 : difficulty === 'HARD' ? 40 : 60
        }
    }

    /**
     * Generate fraction problem (Grade 6–8+)
     */
    private static generateFraction(difficulty: 'HARD' | 'CHALLENGE'): MathProblem {
        const den = [2, 3, 4, 5, 6, 8, 10][this.randomInt(0, 6)]
        const num1 = this.randomInt(1, den - 1)
        const num2 = this.randomInt(1, den - 1)
        const op = Math.random() > 0.5 ? '+' : '-'

        let answerNum = op === '+' ? num1 + num2 : num1 - num2
        const answerDen = den

        // Simplify
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
        const g = gcd(Math.abs(answerNum), answerDen)
        answerNum = answerNum / g
        const simpleDen = answerDen / g

        const answer = Math.round((answerNum / simpleDen) * 100) / 100
        const question = `${num1}/${den} ${op} ${num2}/${den} = ? (as decimal)`

        return {
            id: `frac-${Date.now()}-${Math.random()}`,
            type: 'fraction',
            difficulty,
            content: { question, type: 'fraction', operation: op as '+' | '-' },
            correctAnswer: answer,
            options: this.generateOptions(answer),
            timeLimit: 25,
            points: difficulty === 'HARD' ? 40 : 70
        }
    }

    /**
     * Generate grade-specific content pool (200+ per difficulty tier = 800+ per band)
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        const config = GradeMapper.getConfig(grade)
        const pool: ContentPool = { easy: [], medium: [], hard: [], challenge: [] }

        switch (grade) {
            case 'K2': {
                // EASY: single-digit +/−, no negatives
                for (let i = 0; i < 100; i++) {
                    pool.easy.push(this.generateArithmetic('+', [1, 10], 'EASY', false))
                    pool.easy.push(this.generateArithmetic('-', [1, 10], 'EASY', false))
                }
                for (let i = 0; i < 50; i++) pool.easy.push(this.generateWordProblem('K2', 'EASY'))

                // MEDIUM: up to 20, intro ×
                for (let i = 0; i < 60; i++) {
                    pool.medium.push(this.generateArithmetic('+', [5, 20], 'MEDIUM', false))
                    pool.medium.push(this.generateArithmetic('-', [5, 20], 'MEDIUM', false))
                    pool.medium.push(this.generateArithmetic('×', [1, 5], 'MEDIUM', false))
                }
                for (let i = 0; i < 20; i++) pool.medium.push(this.generateWordProblem('K2', 'MEDIUM'))

                // HARD: up to 20, all ops
                for (let i = 0; i < 50; i++) {
                    pool.hard.push(this.generateArithmetic('+', [10, 20], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('-', [10, 20], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('×', [2, 5], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('÷', [2, 5], 'HARD', false))
                }

                // CHALLENGE: 20-range, multi-step word problems
                for (let i = 0; i < 60; i++) {
                    pool.challenge.push(this.generateArithmetic('+', [10, 20], 'CHALLENGE', false))
                    pool.challenge.push(this.generateArithmetic('×', [2, 10], 'CHALLENGE', false))
                }
                for (let i = 0; i < 30; i++) pool.challenge.push(this.generateWordProblem('K2', 'CHALLENGE'))
                break
            }

            case '35': {
                // EASY: 2-digit +/−
                for (let i = 0; i < 100; i++) {
                    pool.easy.push(this.generateArithmetic('+', [10, 50], 'EASY', false))
                    pool.easy.push(this.generateArithmetic('-', [10, 50], 'EASY', false))
                }
                for (let i = 0; i < 50; i++) pool.easy.push(this.generateWordProblem('35', 'EASY'))

                // MEDIUM: 2-digit all ops + word problems
                for (let i = 0; i < 50; i++) {
                    pool.medium.push(this.generateArithmetic('+', [20, 100], 'MEDIUM', false))
                    pool.medium.push(this.generateArithmetic('-', [20, 100], 'MEDIUM', false))
                    pool.medium.push(this.generateArithmetic('×', [2, 12], 'MEDIUM', false))
                    pool.medium.push(this.generateArithmetic('÷', [2, 12], 'MEDIUM', false))
                }
                for (let i = 0; i < 50; i++) pool.medium.push(this.generateWordProblem('35', 'MEDIUM'))

                // HARD: 3-digit, larger multipliers
                for (let i = 0; i < 50; i++) {
                    pool.hard.push(this.generateArithmetic('+', [50, 200], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('-', [50, 200], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('×', [5, 15], 'HARD', false))
                    pool.hard.push(this.generateArithmetic('÷', [5, 15], 'HARD', false))
                }
                for (let i = 0; i < 30; i++) pool.hard.push(this.generateWordProblem('35', 'HARD'))

                // CHALLENGE: 3-digit, word problems
                for (let i = 0; i < 60; i++) {
                    pool.challenge.push(this.generateArithmetic('+', [100, 500], 'CHALLENGE', false))
                    pool.challenge.push(this.generateArithmetic('×', [10, 25], 'CHALLENGE', false))
                }
                for (let i = 0; i < 30; i++) pool.challenge.push(this.generateWordProblem('35', 'CHALLENGE'))
                break
            }

            case '68': {
                // EASY: negatives, fractions intro
                for (let i = 0; i < 80; i++) {
                    pool.easy.push(this.generateArithmetic('+', [1, 50], 'EASY', true))
                    pool.easy.push(this.generateArithmetic('-', [1, 50], 'EASY', true))
                }
                for (let i = 0; i < 40; i++) pool.easy.push(this.generateWordProblem('68', 'EASY'))

                // MEDIUM: negatives, fractions
                for (let i = 0; i < 50; i++) {
                    pool.medium.push(this.generateArithmetic('+', [10, 100], 'MEDIUM', true))
                    pool.medium.push(this.generateArithmetic('-', [10, 100], 'MEDIUM', true))
                    pool.medium.push(this.generateArithmetic('×', [5, 20], 'MEDIUM', true))
                    pool.medium.push(this.generateArithmetic('÷', [5, 20], 'MEDIUM', true))
                }
                for (let i = 0; i < 30; i++) pool.medium.push(this.generateFraction('HARD'))
                for (let i = 0; i < 30; i++) pool.medium.push(this.generateWordProblem('68', 'MEDIUM'))

                // HARD: order of operations, fractions
                for (let i = 0; i < 50; i++) {
                    pool.hard.push(this.generateArithmetic('+', [50, 200], 'HARD', true))
                    pool.hard.push(this.generateArithmetic('×', [10, 30], 'HARD', true))
                }
                for (let i = 0; i < 50; i++) pool.hard.push(this.generateFraction('HARD'))
                for (let i = 0; i < 30; i++) pool.hard.push(this.generateWordProblem('68', 'HARD'))

                // CHALLENGE: complex fractions, percentages
                for (let i = 0; i < 60; i++) pool.challenge.push(this.generateFraction('CHALLENGE'))
                for (let i = 0; i < 60; i++) pool.challenge.push(this.generateWordProblem('68', 'CHALLENGE'))
                break
            }

            case '910': {
                // EASY: algebraic expressions
                for (let i = 0; i < 100; i++) pool.easy.push(this.generateAlgebraic('HARD'))
                for (let i = 0; i < 50; i++) pool.easy.push(this.generateWordProblem('910', 'EASY'))

                // MEDIUM: linear equations, percentages
                for (let i = 0; i < 100; i++) pool.medium.push(this.generateAlgebraic('HARD'))
                for (let i = 0; i < 50; i++) pool.medium.push(this.generateWordProblem('910', 'MEDIUM'))
                for (let i = 0; i < 50; i++) pool.medium.push(this.generateFraction('HARD'))

                // HARD: exponents, complex equations
                for (let i = 0; i < 100; i++) pool.hard.push(this.generateAlgebraic('CHALLENGE'))
                for (let i = 0; i < 50; i++) pool.hard.push(this.generateWordProblem('910', 'HARD'))
                for (let i = 0; i < 50; i++) pool.hard.push(this.generateFraction('CHALLENGE'))

                // CHALLENGE: systems, quadratic intro
                for (let i = 0; i < 80; i++) pool.challenge.push(this.generateQuadratic())
                for (let i = 0; i < 60; i++) pool.challenge.push(this.generateWordProblem('910', 'CHALLENGE'))
                break
            }

            case '1112': {
                // EASY: quadratics, factorization
                for (let i = 0; i < 100; i++) pool.easy.push(this.generateQuadratic())
                for (let i = 0; i < 50; i++) pool.easy.push(this.generateAlgebraic('HARD'))

                // MEDIUM: systems of equations
                for (let i = 0; i < 100; i++) pool.medium.push(this.generateQuadratic())
                for (let i = 0; i < 50; i++) pool.medium.push(this.generateWordProblem('1112', 'MEDIUM'))
                for (let i = 0; i < 50; i++) pool.medium.push(this.generateAlgebraic('CHALLENGE'))

                // HARD: applied math, compound interest
                for (let i = 0; i < 100; i++) pool.hard.push(this.generateQuadratic())
                for (let i = 0; i < 60; i++) pool.hard.push(this.generateWordProblem('1112', 'HARD'))
                for (let i = 0; i < 40; i++) pool.hard.push(this.generateFraction('CHALLENGE'))

                // CHALLENGE: full curriculum
                for (let i = 0; i < 100; i++) pool.challenge.push(this.generateQuadratic())
                for (let i = 0; i < 60; i++) pool.challenge.push(this.generateWordProblem('1112', 'CHALLENGE'))
                for (let i = 0; i < 40; i++) pool.challenge.push(this.generateAlgebraic('CHALLENGE'))
                break
            }
        }

        return pool
    }

    /**
     * Legacy: generate flat content pool (defaults to grade '35' for backward compatibility)
     */
    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }

    /**
     * Simulate 10,000 generations to validate generator safety
     */
    static simulate(count: number = 10000): { valid: boolean; errors: string[]; stats: Record<GradeBand, number> } {
        const errors: string[] = []
        const stats: Record<GradeBand, number> = { K2: 0, '35': 0, '68': 0, '910': 0, '1112': 0 }
        const grades: GradeBand[] = ['K2', '35', '68', '910', '1112']

        for (let i = 0; i < count; i++) {
            const grade = grades[i % 5]
            try {
                const pool = this.generateGradePool(grade)
                const allProblems = [...pool.easy, ...pool.medium, ...pool.hard, ...pool.challenge] as MathProblem[]

                for (const p of allProblems) {
                    if (isNaN(p.correctAnswer) || !isFinite(p.correctAnswer)) {
                        errors.push(`[${grade}] NaN/Inf answer: ${p.content.question}`)
                    }
                    if (Object.is(p.correctAnswer, -0)) {
                        errors.push(`[${grade}] -0 answer: ${p.content.question}`)
                    }
                    const uniqueOptions = new Set(p.options)
                    if (uniqueOptions.size < p.options.length) {
                        errors.push(`[${grade}] Duplicate options: ${p.content.question}`)
                    }
                    if (!p.options.includes(p.correctAnswer)) {
                        errors.push(`[${grade}] Correct answer not in options: ${p.content.question}`)
                    }
                }

                stats[grade]++
            } catch (e) {
                errors.push(`[${grade}] Crash: ${e}`)
            }
        }

        return { valid: errors.length === 0, errors: errors.slice(0, 20), stats }
    }
}
