/**
 * Game Engine Audit Test — 10,000 Simulation
 * __tests__/validation/game-engine-audit.test.ts
 *
 * Proves:
 *   ✅ Zero NaN answers across all difficulty levels
 *   ✅ Zero undefined answers
 *   ✅ No multi-correct option sets (only 1 option matches correct answer)
 *   ✅ No duplicate options
 *   ✅ No impossible questions (correct answer always present in options)
 *   ✅ Division never produces non-integers
 *   ✅ generateOptions always returns exactly 4 finite values
 */

import { MathEngine, MathConfig } from '@/lib/game-engine/math-engine'
import {
    runMathEngineIntegrity,
    runDivisionSafetyCheck,
    validateAnswerOptions
} from '@/lib/game-engine/integrity-validator'

// On CI use a smaller count to keep the suite fast (~2s vs ~40s)
// Full 10,000-run soak test is reserved for local pre-release validation
const SIMULATION_COUNT = process.env.CI === 'true' ? 500 : 10_000

describe('MathEngine — 10,000-run integrity simulation', () => {
    it('produces zero NaN / Infinity / undefined answers', () => {
        const report = runMathEngineIntegrity(SIMULATION_COUNT)
        expect(report.nanCount).toBe(0)
        expect(report.undefinedCount).toBe(0)
        expect(report.sampleErrors).toHaveLength(0)
        expect(report.passed).toBe(true)
    }, 60_000)

    it('never produces multi-correct option sets', () => {
        const report = runMathEngineIntegrity(SIMULATION_COUNT)
        expect(report.multiCorrectCount).toBe(0)
    }, 60_000)

    it('never produces duplicate options', () => {
        const report = runMathEngineIntegrity(SIMULATION_COUNT)
        expect(report.duplicateOptionCount).toBe(0)
    }, 60_000)

    it('always includes the correct answer in the options', () => {
        const report = runMathEngineIntegrity(SIMULATION_COUNT)
        expect(report.impossibleQuestionCount).toBe(0)
    }, 60_000)
})

describe('Division safety — 5,000 forced-÷ runs', () => {
    it('never produces NaN or Infinity for division problems', () => {
        const report = runDivisionSafetyCheck(5_000)
        expect(report.nanCount).toBe(0)
        expect(report.passed).toBe(true)
    }, 30_000)

    it('always produces integer results for division (no remainder)', () => {
        // Run 1000 extra explicit checks
        const errors: string[] = []
        for (let i = 0; i < 1000; i++) {
            const prob = MathEngine.generateProblem({
                difficulty: 'INTERMEDIATE',
                forceOperation: '÷',
                allowNegatives: false
            })
            if (prob.answer !== Math.round(prob.answer)) {
                errors.push(`Non-integer: "${prob.expression}" = ${prob.answer}`)
            }
        }
        expect(errors).toHaveLength(0)
    })
})

describe('MathEngine.generateOptions — correctness guarantees', () => {
    it('always returns exactly 4 options', () => {
        for (let i = 0; i < 1000; i++) {
            const answer = Math.floor(Math.random() * 200) - 100
            const options = MathEngine.generateOptions(answer)
            expect(options).toHaveLength(4)
        }
    })

    it('never returns NaN or Infinity in options', () => {
        for (let i = 0; i < 1000; i++) {
            const answer = Math.floor(Math.random() * 200) - 100
            const options = MathEngine.generateOptions(answer)
            for (const opt of options) {
                expect(isFinite(opt)).toBe(true)
                expect(isNaN(opt)).toBe(false)
            }
        }
    })

    it('always includes the correct answer in options', () => {
        for (let i = 0; i < 1000; i++) {
            const answer = Math.floor(Math.random() * 200) - 100
            const options = MathEngine.generateOptions(answer)
            expect(options).toContain(answer)
        }
    })

    it('handles NaN input gracefully (returns safe fallback)', () => {
        const options = MathEngine.generateOptions(NaN)
        expect(options).toHaveLength(4)
        expect(options.every(o => isFinite(o))).toBe(true)
    })

    it('handles negative-zero gracefully', () => {
        const prob = MathEngine.generateProblem({
            difficulty: 'BEGINNER',
            forceOperation: '-',
            customRange: [5, 5], // 5 - 5 = 0
        })
        expect(Object.is(prob.answer, -0)).toBe(false) // must be +0
        expect(prob.answer).toBe(0)
    })
})

describe('MathEngine edge cases — zero, negatives, large numbers', () => {
    it('handles a - a = 0 without producing -0', () => {
        const result = MathEngine.calculate(5, 5, '-')
        expect(Object.is(result, -0)).toBe(false)
        expect(result).toBe(0)
    })

    it('handles division by zero safely → returns 0', () => {
        const result = MathEngine.calculate(10, 0, '÷')
        expect(result).toBe(0)
        expect(isNaN(result)).toBe(false)
    })

    it('BEGINNER difficulty never produces negative answers', () => {
        const errors: string[] = []
        for (let i = 0; i < 500; i++) {
            const prob = MathEngine.generateProblem({ difficulty: 'BEGINNER', allowNegatives: false })
            if (prob.answer < 0) errors.push(`Negative BEGINNER answer: ${prob.expression} = ${prob.answer}`)
        }
        expect(errors).toHaveLength(0)
    })

    it('CHALLENGE difficulty produces answers in a reasonable range', () => {
        const errors: string[] = []
        for (let i = 0; i < 500; i++) {
            const prob = MathEngine.generateProblem({ difficulty: 'CHALLENGE', allowNegatives: true })
            if (Math.abs(prob.answer) > 40_000) {
                errors.push(`Answer out of bounds: ${prob.expression} = ${prob.answer}`)
            }
        }
        expect(errors).toHaveLength(0)
    })
})

describe('validateAnswerOptions — option set integrity', () => {
    it('passes for a valid option set', () => {
        const result = validateAnswerOptions(['12', '15', '18', '21'], '12')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('fails when correct answer is missing from options', () => {
        const result = validateAnswerOptions(['15', '18', '21', '24'], '12')
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('not found'))).toBe(true)
    })

    it('fails on duplicate options', () => {
        const result = validateAnswerOptions(['12', '12', '18', '21'], '12')
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true)
    })

    it('fails with only 1 option', () => {
        const result = validateAnswerOptions(['12'], '12')
        expect(result.valid).toBe(false)
    })
})
