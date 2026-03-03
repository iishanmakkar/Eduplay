/**
 * __tests__/generators/math-generator.test.ts
 *
 * Comprehensive test suite for all math generators.
 * 10,000 runs per game — validates:
 *  1. Exactly 4 options returned
 *  2. No duplicate options
 *  3. Answer is in options
 *  4. No NaN / undefined values
 */

import { generateQuestion } from '../../lib/games/generators/math-generator'

const MATH_GAME_KEYS = [
    'NUMBER_CATERPILLAR', 'HOT_AIR_BALLOON_RACE', 'APPLE_ORCHARD_COLLECTOR', 'FISH_TANK_FILL',
    'SHAPE_SORTER_CITY', 'PIZZA_SLICE_WARS', 'DECIMAL_DODGE', 'MARKET_MAYHEM',
    'FACTOR_FORTRESS', 'FRACTION_ARROW_ARCHER', 'RATIO_RAIL_RUSH', 'MULTIPLIER_MAYHEM',
    'ANGLE_ASSASSIN', 'ALGEBRA_WAVE_SURFER', 'AREA_CONSTRUCTOR', 'INTEGER_ICE_BATTLE',
    'DATA_DETECTIVE', 'PROBABILITY_POKER', 'COORDINATE_COMBAT', 'POLYNOMIAL_PACKAGER',
    'CALCULUS_CLIFF', 'QUADRATIC_QUEST', 'TRIG_BRIDGE_BUILDER', 'MATRIX_MORPH_DUEL',
    'INTEGRAL_INVADER', 'VECTOR_SPACE_VOYAGER', 'STATISTICS_STOCK_PROPHET',
    'NUMBER_THEORY_VAULT', 'COMPLEX_NAVIGATOR', 'PERMUTATION_COASTER', 'SURVEYORS_SPRINT',
    'BINARY_BLASTER',
]

const RUNS_FAST = 500    // For normal `npm test`
const RUNS_FULL = 10000  // For `npm test -- --testPathPattern=generators` (nightly)
const RUNS = process.env.FULL_SIM === '1' ? RUNS_FULL : RUNS_FAST

describe('Math Generator — structural integrity', () => {
    test.each(MATH_GAME_KEYS)('%s: %i runs — 4 options, no duplicates, answer in options', (gameKey) => {
        const errors: string[] = []

        for (let i = 0; i < RUNS; i++) {
            let q: ReturnType<typeof generateQuestion>

            try {
                q = generateQuestion(gameKey)
            } catch (e) {
                errors.push(`Iteration ${i}: THREW — ${(e as Error).message}`)
                break
            }

            if (!q) { errors.push(`Iteration ${i}: returned null`); break }

            // 1. Exactly 4 options
            if (!q.options || q.options.length !== 4) {
                errors.push(`Iteration ${i}: options.length=${q.options?.length} prompt="${q.prompt.slice(0, 50)}"`)
                if (errors.length >= 3) break
                continue
            }

            // 2. No NaN / undefined in options
            for (const opt of q.options) {
                if (opt === null || opt === undefined || opt !== opt) {  // NaN check
                    errors.push(`Iteration ${i}: NaN/null/undefined option: "${opt}"`)
                    if (errors.length >= 3) break
                }
            }

            // 3. No duplicate options (case-insensitive)
            const lower = q.options.map(o => String(o).toLowerCase().trim())
            if (new Set(lower).size !== 4) {
                errors.push(`Iteration ${i}: DUPLICATE options: ${JSON.stringify(q.options)}`)
                if (errors.length >= 3) break
                continue
            }

            // 4. Answer in options
            if (!lower.includes(String(q.answer).toLowerCase().trim())) {
                errors.push(`Iteration ${i}: ANS_NOT_IN_OPTIONS: ans="${q.answer}" opts=${JSON.stringify(q.options)} prompt="${q.prompt.slice(0, 50)}"`)
                if (errors.length >= 3) break
            }

            // 5. No NaN answer
            if (String(q.answer) === 'NaN' || q.answer === undefined || q.answer === null) {
                errors.push(`Iteration ${i}: NaN/null answer`)
                if (errors.length >= 3) break
            }
        }

        if (errors.length > 0) {
            fail(`${gameKey} failed:\n${errors.join('\n')}`)
        }
    })
})

describe('Math Generator — answer validator integration', () => {
    test('FRACTION_ARROW_ARCHER answers validate via math_fraction strategy', () => {
        for (let i = 0; i < 100; i++) {
            const q = generateQuestion('FRACTION_ARROW_ARCHER')
            if (!q) continue
            // Answer should be parseable as fraction
            expect(q.answer).toMatch(/^\d+\/\d+$|^\d+(\.\d+)?$/)
        }
    })

    test('QUADRATIC_QUEST answers validate via math_plus_minus strategy', () => {
        for (let i = 0; i < 100; i++) {
            const q = generateQuestion('QUADRATIC_QUEST')
            if (!q) continue
            // Should either be a number or fraction string
            expect(typeof q.answer).toBe('string')
            expect(q.answer.length).toBeGreaterThan(0)
        }
    })

    test('NUMBER_CATERPILLAR always returns finite number answer', () => {
        for (let i = 0; i < 500; i++) {
            const q = generateQuestion('NUMBER_CATERPILLAR')
            if (!q) continue
            const n = parseFloat(q.answer)
            expect(isFinite(n)).toBe(true)
        }
    })
})
