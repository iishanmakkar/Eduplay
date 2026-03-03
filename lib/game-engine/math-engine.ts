/**
 * Math Engine
 * Robust, safe mathematical expression generator and evaluator.
 * Guarantees correctness without using eval().
 */

export type Operation = '+' | '-' | '×' | '÷'

export interface MathConfig {
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'CHALLENGE'
    allowNegatives?: boolean
    allowDecimals?: boolean
    allowFractions?: boolean // Not yet implemented
    maxSteps?: number // 1 for "a+b", 2 for "(a+b)*c"
    customRange?: [number, number]
    forceOperation?: Operation
}

export interface GeneratedProblem {
    expression: string
    answer: number
    steps?: string[]
    options?: number[]
}

export class MathEngine {
    // Safe evaluation of basic operations
    static calculate(a: number, b: number, op: Operation): number {
        let result: number
        switch (op) {
            case '+': result = a + b; break
            case '-': result = a - b; break
            case '×': result = a * b; break
            case '÷': result = b === 0 ? 0 : a / b; break
            default: result = 0
        }
        // Normalise negative zero
        return Object.is(result, -0) ? 0 : result
    }

    // Generate a problem based on config
    static generateProblem(config: MathConfig): GeneratedProblem {
        const { difficulty, allowNegatives, customRange, forceOperation } = config

        // Determine complexity
        let isTwoStep = false
        if (!customRange && !forceOperation) {
            if (config.maxSteps === 2) isTwoStep = true
            if (difficulty === 'ADVANCED' && Math.random() > 0.7) isTwoStep = true
            if (difficulty === 'CHALLENGE') isTwoStep = true
        }
        if (config.maxSteps === 2) isTwoStep = true
        if (difficulty === 'ADVANCED' && Math.random() > 0.7) isTwoStep = true
        if (difficulty === 'CHALLENGE') isTwoStep = true // Always multi-step or hard single step

        if (isTwoStep) {
            return this.generateTwoStepProblem(config)
        }

        return this.generateSingleStepProblem(config)
    }

    // Single step: A op B
    private static generateSingleStepProblem(config: MathConfig): GeneratedProblem {
        const { difficulty, allowNegatives, customRange, forceOperation } = config

        let min = 1, max = 10
        let ops: Operation[] = ['+']

        if (customRange) {
            [min, max] = customRange
        } else {
            switch (difficulty) {
                case 'BEGINNER':
                    min = 1; max = 20
                    ops = ['+', '-']
                    break
                case 'INTERMEDIATE':
                    min = 2; max = 50
                    ops = ['+', '-', '×', '÷']
                    break
                case 'ADVANCED':
                    min = 10; max = 100
                    ops = ['+', '-', '×', '÷']
                    break
                case 'CHALLENGE':
                    min = 20; max = 200
                    ops = ['+', '-', '×', '÷']
                    break
            }
        }

        const op = forceOperation || ops[Math.floor(Math.random() * ops.length)]
        let a = this.randomInt(min, max)
        let b = this.randomInt(min, max)

        // Adjust constraints
        if (op === '-') {
            if (!allowNegatives && a < b) [a, b] = [b, a]
        }

        if (op === '÷') {
            if (b === 0) b = 1
            a = b * this.randomInt(1, Math.floor(max / b) || 12)
        }

        // Apply negatives
        if (allowNegatives && difficulty !== 'BEGINNER') {
            if (Math.random() > 0.7) a *= -1
            if (Math.random() > 0.7) b *= -1
        }

        let answer = this.calculate(a, b, op)
        if (answer === -0) answer = 0

        let expr = `${a} ${op} ${b}`
        if (b < 0) expr = `${a} ${op} (${b})`

        return {
            expression: expr,
            answer,
            options: this.generateOptions(answer)
        }
    }

    // Two step: (A op1 B) op2 C  OR  A op1 (B op2 C)
    // Uses "Reverse Engineering" to ensure clean integer results
    private static generateTwoStepProblem(config: MathConfig): GeneratedProblem {
        const { difficulty, allowNegatives } = config
        const ops: Operation[] = ['+', '-', '×', '÷']

        // 1. Pick final answer
        const maxAnswer = difficulty === 'CHALLENGE' ? 100 : 50
        const minAnswer = allowNegatives ? -50 : 0
        const finalAnswer = this.randomInt(minAnswer, maxAnswer)

        // 2. Pick last operation (op2) and C
        // Formula: Step1 op2 C = Answer
        const op2 = ops[Math.floor(Math.random() * ops.length)]
        let c = this.randomInt(2, 12)
        let step1Result = 0

        // Reverse calculate Step1Result based on op2
        // If (Step1 / C) = Answer => Step1 = Answer * C
        // If (Step1 * C) = Answer => Step1 = Answer / C (Must be divisible)
        // If (Step1 - C) = Answer => Step1 = Answer + C
        // If (Step1 + C) = Answer => Step1 = Answer - C

        // For multiplication/division, we need to be careful to keep numbers reasonable
        switch (op2) {
            case '+':
                step1Result = finalAnswer - c
                break
            case '-':
                step1Result = finalAnswer + c
                break
            case '÷':
                // (Step1 / C) = Answer  =>  Step1 = Answer * C
                // Check bounds to prevent massive numbers
                if (Math.abs(finalAnswer * c) > 200) {
                    // Fallback to simpler op
                    return this.generateSingleStepProblem(config)
                }
                step1Result = finalAnswer * c
                break
            case '×':
                // Forward construction: pick a clean step1 and derive the final answer from it
                // This guarantees integer results without needing finalAnswer to be divisible by c
                step1Result = this.randomInt(allowNegatives ? -12 : 2, 12)
                // We'll recalculate the actual final answer at the end using real math
                break
        }

        // 3. Now decompose Step1Result into (A op1 B)
        // We need: A op1 B = step1Result
        const op1 = ops[Math.floor(Math.random() * ops.length)]
        let a = 0, b = 0

        switch (op1) {
            case '+':
                // A + B = res
                b = this.randomInt(1, 20)
                a = step1Result - b
                break
            case '-':
                // A - B = res => A = res + B
                b = this.randomInt(1, 20)
                a = step1Result + b
                break
            case '÷':
                // A / B = res => A = res * B
                b = this.randomInt(2, 10)
                // Keep A reasonable
                if (Math.abs(step1Result * b) > 100) {
                    b = 2 // Fallback
                }
                a = step1Result * b
                break
            case '×':
                // A * B = res
                // Find factors of res
                if (step1Result === 0) {
                    a = 0; b = this.randomInt(1, 10)
                } else {
                    // Find valid factors
                    const factors = []
                    for (let i = 1; i <= Math.abs(step1Result); i++) {
                        if (step1Result % i === 0) factors.push(i)
                    }
                    // Pick a factor
                    const val = factors[Math.floor(Math.random() * factors.length)]
                    a = val
                    b = step1Result / a
                    // Handle signs: a*b should equal step1Result (which might be negative)
                    // If step1Result is negative, one of a/b must be negative (handled by math)
                    // e.g. -12. Factors of 12 are 1,2,3,4,6,12.
                    // If we pick 3. 3 * ? = -12. ? = -4.
                    // Math works naturally.
                }
                break
        }

        // Randomly choose structure: (A op1 B) op2 C  OR  C op2 (A op1 B)
        // Note: For subtraction and division, order matters.
        // We derived it as: Step1 op2 C = Answer.
        // So structure is (A op1 B) op2 C.

        // Formatting constraints
        const formatNum = (n: number) => n < 0 ? `(${n})` : `${n}`

        const innerExpr = `${formatNum(a)} ${op1} ${formatNum(b)}`
        const finalExpr = `${innerExpr} ${op2} ${formatNum(c)}` // e.g. "5 + 3 * 2" -> evaluation order mismatch!
        // Standard Math order of operations applies! 
        // If we write 5 + 3 * 2, it is 5 + 6 = 11.
        // But our logic assumed (5+3) * 2 = 16.
        // We MUST add parentheses around the inner expression if op2 has higher precedence than op1.

        const precedence = { '×': 2, '÷': 2, '+': 1, '-': 1 }
        const p1 = precedence[op1]
        const p2 = precedence[op2]

        let expression = `${innerExpr} ${op2} ${formatNum(c)}`
        // If generated as (A op1 B), we need parens if p1 < p2
        // e.g. (A+B)*C. + is 1, * is 2. 1 < 2 -> Need parens -> (A+B) * C
        if (p1 < p2) {
            expression = `(${innerExpr}) ${op2} ${formatNum(c)}`
        } else {
            // Same precedence, left-to-right is default.
            // (A-B)-C vs A-B-C. Same.
            // (A*B)/C vs A*B/C. Same.
            // Exception: If we constructed C op2 (A op1 B).
            // But we constructed (A op1 B) op2 C.
        }

        // Recalculate answer precisely to ensure no drift
        // (Just to be 100% safe against the reverse engineering logic bugs)
        // Manually parse logic:
        const realStep1 = this.calculate(a, b, op1)
        const realAnswer = this.calculate(realStep1, c, op2)

        return {
            expression,
            answer: realAnswer,
            options: this.generateOptions(realAnswer)
        }
    }

    private static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // Generate smart distractors — guaranteed unique, no NaN, no Infinity
    static generateOptions(correctAnswer: number, count: number = 4): number[] {
        // Guard: if answer is not a valid finite number, return safe fallback options
        if (!isFinite(correctAnswer) || isNaN(correctAnswer)) {
            return [0, 1, 2, 3].slice(0, count)
        }

        const options = new Set<number>()
        options.add(correctAnswer)

        let attempts = 0
        const range = Math.max(Math.abs(correctAnswer) * 0.5, 5)

        while (options.size < count && attempts < 100) {
            attempts++
            const offset = Math.floor((Math.random() - 0.5) * 2 * range)
            if (offset === 0) continue
            const option = correctAnswer + offset
            // Reject NaN / Infinity distractors
            if (!isFinite(option) || isNaN(option)) continue
            options.add(option)
        }

        // Deterministic fill if random failed
        let fill = 1
        while (options.size < count) {
            const candidate = correctAnswer + fill * (fill % 2 === 0 ? 1 : -1)
            if (!options.has(candidate) && isFinite(candidate)) options.add(candidate)
            fill++
        }

        return Array.from(options).sort(() => Math.random() - 0.5)
    }

    /**
     * Run a simulation to verify generator safety
     * @param count Number of problems to simulate
     */
    static simulate(count: number = 1000): { valid: boolean, errors: string[] } {
        const errors: string[] = []
        for (let i = 0; i < count; i++) {
            try {
                // Determine difficulty cyclicly
                const diffs: MathConfig['difficulty'][] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE']
                const diff = diffs[i % 4]

                const prob = this.generateProblem({
                    difficulty: diff,
                    allowNegatives: diff !== 'BEGINNER',
                    maxSteps: (diff === 'ADVANCED' || diff === 'CHALLENGE') ? 2 : 1
                })

                if (isNaN(prob.answer) || !isFinite(prob.answer)) {
                    errors.push(`Invalid answer: ${prob.expression} = ${prob.answer}`)
                }

                // Parse expression simply to verify (eval for test only)
                // convert × to * and ÷ to /
                const evalExpr = prob.expression.replace(/×/g, '*').replace(/÷/g, '/')
                // eslint-disable-next-line no-eval
                const checked = eval(evalExpr)

                if (Math.abs(checked - prob.answer) > 0.001) {
                    errors.push(`Mismatch: ${prob.expression} = ${prob.answer} (Eval: ${checked})`)
                }

                // Check for duplicates in options if we had them (not generating options here yet)
            } catch (e) {
                errors.push(`Crash: ${e}`)
            }
        }
        return {
            valid: errors.length === 0,
            errors
        }
    }
}
