/**
 * BKT Crash Guard Tests
 *
 * Validates that the Bayesian Knowledge Tracing engine:
 *  1. Never allows P(L) to reach 1.0 (division-by-zero in correct posterior)
 *  2. Never allows P(L) to reach 0.0 (division-by-zero in incorrect posterior)
 *  3. Converges stably under 100 consecutive correct or incorrect answers
 *  4. Forgetting curve decays mastery correctly without going below MIN
 *
 * These are pure-math tests — no Prisma or network mocks required.
 */

import { clampProbability, applyForgettingCurve, BKT_BOUNDS } from '@/lib/gamification/bkt-engine'

// ─── Pure BKT math (extracted from bkt-engine for unit testing) ───────────────

const DEFAULT_PARAMS = {
    pS: 0.1,   // slip
    pG: 0.2,   // guess
    pT: 0.1,   // transit
}

function bktStep(pL: number, isCorrect: boolean, params = DEFAULT_PARAMS): number {
    const { pS, pG, pT } = params

    let pL_given_obs: number
    if (isCorrect) {
        const num = pL * (1 - pS)
        const den = num + (1 - pL) * pG
        pL_given_obs = den === 0 ? BKT_BOUNDS.MIN : num / den
    } else {
        const num = pL * pS
        const den = num + (1 - pL) * (1 - pG)
        pL_given_obs = den === 0 ? BKT_BOUNDS.MIN : num / den
    }

    const newPL = pL_given_obs + (1 - pL_given_obs) * pT
    return clampProbability(newPL)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BKT Crash Guard — Probability Bounds', () => {

    it('P(L) must never reach 1.0 after 100 consecutive CORRECT answers', () => {
        let pL = 0.1
        for (let i = 0; i < 100; i++) {
            pL = bktStep(pL, true)
            expect(pL).toBeLessThan(1.0)
            expect(pL).toBeLessThanOrEqual(BKT_BOUNDS.MAX)
            expect(pL).toBeGreaterThanOrEqual(BKT_BOUNDS.MIN)
        }
        // Also assert it's actually converging (high mastery is expected)
        expect(pL).toBeGreaterThan(0.80)
    })

    it('P(L) must never reach 0.0 after 100 consecutive INCORRECT answers', () => {
        let pL = 0.9
        for (let i = 0; i < 100; i++) {
            pL = bktStep(pL, false)
            expect(pL).toBeGreaterThan(0.0)
            expect(pL).toBeGreaterThanOrEqual(BKT_BOUNDS.MIN)
            expect(pL).toBeLessThanOrEqual(BKT_BOUNDS.MAX)
        }
        // Assert it has actually dropped (learning regression)
        expect(pL).toBeLessThan(0.5)
    })

    it('denominator is never zero for any valid P(L) in [MIN, MAX]', () => {
        const values = [BKT_BOUNDS.MIN, 0.1, 0.2, 0.5, 0.7, 0.9, BKT_BOUNDS.MAX]
        const { pS, pG } = DEFAULT_PARAMS
        for (const pL of values) {
            const correctDen = pL * (1 - pS) + (1 - pL) * pG
            const incorrectDen = pL * pS + (1 - pL) * (1 - pG)
            expect(correctDen).toBeGreaterThan(0)
            expect(incorrectDen).toBeGreaterThan(0)
        }
    })

    it('isMastered() returns true only when mastery is at threshold', () => {
        // Import the pure static method directly
        const { BayesianKnowledgeTracing } = require('@/lib/gamification/bkt-engine')
        expect(BayesianKnowledgeTracing.isMastered(0.89)).toBe(false)
        expect(BayesianKnowledgeTracing.isMastered(0.90)).toBe(true)
        expect(BayesianKnowledgeTracing.isMastered(0.95)).toBe(true)
        expect(BayesianKnowledgeTracing.isMastered(BKT_BOUNDS.MAX)).toBe(true)
    })
})

describe('BKT Forgetting Curve', () => {

    it('should not decay when daysInactive = 0', () => {
        const pL = 0.8
        expect(applyForgettingCurve(pL, 0)).toBeCloseTo(0.8, 5)
    })

    it('should decay after 30 days of inactivity', () => {
        const pL = 0.8
        const decayed = applyForgettingCurve(pL, 30)
        expect(decayed).toBeLessThan(pL)
        // λ=0.01, 30 days: e^(-0.3) ≈ 0.7408, 0.8 * 0.7408 ≈ 0.593
        expect(decayed).toBeCloseTo(0.8 * Math.exp(-0.01 * 30), 3)
    })

    it('should decay after 69 days (approximate half-life)', () => {
        const pL = 0.8
        const decayed = applyForgettingCurve(pL, 69)
        // Half-life at λ=0.01 is ln(2)/0.01 ≈ 69.3 days
        expect(decayed).toBeCloseTo(pL * 0.5, 1)
    })

    it('should never decay below BKT_BOUNDS.MIN regardless of inactive days', () => {
        const pL = BKT_BOUNDS.MIN + 0.001 // barely above minimum
        const decayed = applyForgettingCurve(pL, 10000)
        expect(decayed).toBeGreaterThanOrEqual(BKT_BOUNDS.MIN)
    })

    it('should not apply decay for negative daysInactive', () => {
        const pL = 0.7
        expect(applyForgettingCurve(pL, -5)).toBe(pL)
    })
})

describe('clampProbability utility', () => {
    it('clamps above-MAX values to MAX', () => {
        expect(clampProbability(1.0)).toBe(BKT_BOUNDS.MAX)
        expect(clampProbability(1.5)).toBe(BKT_BOUNDS.MAX)
    })

    it('clamps below-MIN values to MIN', () => {
        expect(clampProbability(0.0)).toBe(BKT_BOUNDS.MIN)
        expect(clampProbability(-0.5)).toBe(BKT_BOUNDS.MIN)
    })

    it('passes through valid probabilities unchanged', () => {
        expect(clampProbability(0.5)).toBe(0.5)
        expect(clampProbability(BKT_BOUNDS.MIN)).toBe(BKT_BOUNDS.MIN)
        expect(clampProbability(BKT_BOUNDS.MAX)).toBe(BKT_BOUNDS.MAX)
    })
})
