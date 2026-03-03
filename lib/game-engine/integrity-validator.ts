/**
 * Game Integrity Validator
 * lib/game-engine/integrity-validator.ts
 *
 * Validates every game generator runs 10,000× without:
 *   - NaN or undefined answers
 *   - Impossible questions (no correct answer attainable)
 *   - Duplicate answer options
 *   - Multi-correct option sets
 *
 * Used by:
 *   - `__tests__/validation/game-engine-audit.test.ts` (CI)
 *   - `GET /api/health/game-integrity` (production pulse check)
 */

import { MathEngine, MathConfig } from './math-engine'

export interface IntegrityCheckResult {
    gameType: string
    simulations: number
    passed: boolean
    nanCount: number
    undefinedCount: number
    multiCorrectCount: number
    duplicateOptionCount: number
    impossibleQuestionCount: number
    errors: string[]
    sampleErrors: string[] // First 5 unique errors
}

export interface GameIntegrityReport {
    totalGames: number
    allPassed: boolean
    results: IntegrityCheckResult[]
    runAt: string
    durationMs: number
}

// ── Math problem integrity check ──────────────────────────────────────────────

function validateMathProblem(
    prob: ReturnType<typeof MathEngine.generateProblem>,
    index: number
): string[] {
    const errors: string[] = []

    // 1. Answer must be a finite number
    if (typeof prob.answer !== 'number' || isNaN(prob.answer) || !isFinite(prob.answer)) {
        errors.push(`[${index}] Invalid answer: ${prob.answer} for "${prob.expression}"`)
    }

    // 2. Options must exist and have exactly 4 entries
    if (!prob.options || prob.options.length !== 4) {
        errors.push(`[${index}] Options count wrong: ${prob.options?.length ?? 0} (expected 4)`)
    }

    if (prob.options) {
        // 3. No duplicate options
        const unique = new Set(prob.options)
        if (unique.size !== prob.options.length) {
            errors.push(`[${index}] Duplicate options: [${prob.options.join(', ')}] for "${prob.expression}"`)
        }

        // 4. Correct answer must be in options
        if (!prob.options.includes(prob.answer)) {
            errors.push(`[${index}] Correct answer ${prob.answer} not in options [${prob.options.join(', ')}]`)
        }

        // 5. No NaN or Infinity in options
        for (const opt of prob.options) {
            if (isNaN(opt) || !isFinite(opt)) {
                errors.push(`[${index}] Invalid option value: ${opt} in [${prob.options.join(', ')}]`)
            }
        }

        // 6. Only one correct option (no multi-correct)
        const correctMatches = prob.options.filter(o => Math.abs(o - prob.answer) < 0.01).length
        if (correctMatches > 1) {
            errors.push(`[${index}] Multi-correct: ${correctMatches} options match answer ${prob.answer}`)
        }
    }

    return errors
}

// ── Per-game integrity simulation ─────────────────────────────────────────────

export function runMathEngineIntegrity(simulations = 10_000): IntegrityCheckResult {
    const errors: string[] = []
    let nanCount = 0
    let undefinedCount = 0
    let multiCorrectCount = 0
    let duplicateOptionCount = 0
    let impossibleQuestionCount = 0

    const diffs: MathConfig['difficulty'][] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE']

    for (let i = 0; i < simulations; i++) {
        try {
            const diff = diffs[i % 4]
            const prob = MathEngine.generateProblem({
                difficulty: diff,
                allowNegatives: diff !== 'BEGINNER',
                maxSteps: (diff === 'ADVANCED' || diff === 'CHALLENGE') ? 2 : 1
            })

            const probErrors = validateMathProblem(prob, i)

            for (const e of probErrors) {
                errors.push(e)
                if (e.includes('Invalid answer') || e.includes('isNaN')) nanCount++
                if (e.includes('undefined')) undefinedCount++
                if (e.includes('Multi-correct')) multiCorrectCount++
                if (e.includes('Duplicate')) duplicateOptionCount++
                if (e.includes('not in options')) impossibleQuestionCount++
            }
        } catch (err: any) {
            errors.push(`[${i}] CRASH: ${err?.message ?? err}`)
        }
    }

    return {
        gameType: 'SPEED_MATH',
        simulations,
        passed: errors.length === 0,
        nanCount,
        undefinedCount,
        multiCorrectCount,
        duplicateOptionCount,
        impossibleQuestionCount,
        errors,
        sampleErrors: [...new Set(errors)].slice(0, 5)
    }
}

// ── Division safety check ──────────────────────────────────────────────────────

export function runDivisionSafetyCheck(simulations = 5_000): IntegrityCheckResult {
    const errors: string[] = []

    for (let i = 0; i < simulations; i++) {
        try {
            const prob = MathEngine.generateProblem({
                difficulty: i % 2 === 0 ? 'INTERMEDIATE' : 'ADVANCED',
                forceOperation: '÷',
                allowNegatives: false
            })

            if (isNaN(prob.answer) || !isFinite(prob.answer)) {
                errors.push(`[${i}] Division produced NaN/Infinity: "${prob.expression}" = ${prob.answer}`)
            }
            if (prob.answer !== Math.round(prob.answer)) {
                errors.push(`[${i}] Division not clean integer: "${prob.expression}" = ${prob.answer}`)
            }
        } catch (err: any) {
            errors.push(`Crash: ${err?.message}`)
        }
    }

    return {
        gameType: 'DIVISION_SAFETY',
        simulations,
        passed: errors.length === 0,
        nanCount: errors.filter(e => e.includes('NaN')).length,
        undefinedCount: 0,
        multiCorrectCount: 0,
        duplicateOptionCount: 0,
        impossibleQuestionCount: 0,
        errors,
        sampleErrors: [...new Set(errors)].slice(0, 5)
    }
}

// ── Full integrity report ──────────────────────────────────────────────────────

export function runFullIntegrityReport(simulationsPerGame = 10_000): GameIntegrityReport {
    const start = Date.now()

    const results: IntegrityCheckResult[] = [
        runMathEngineIntegrity(simulationsPerGame),
        runDivisionSafetyCheck(simulationsPerGame / 2),
    ]

    return {
        totalGames: results.length,
        allPassed: results.every(r => r.passed),
        results,
        runAt: new Date().toISOString(),
        durationMs: Date.now() - start
    }
}

// ── Answer option uniqueness validator (used by all game types) ───────────────

export function validateAnswerOptions(options: string[], correctAnswer: string): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    // 1. No duplicates
    const unique = new Set(options.map(o => o.trim().toLowerCase()))
    if (unique.size !== options.length) {
        errors.push(`Duplicate options detected: [${options.join(' | ')}]`)
    }

    // 2. Correct answer present
    const correctNorm = correctAnswer.trim().toLowerCase()
    if (!options.some(o => o.trim().toLowerCase() === correctNorm)) {
        errors.push(`Correct answer "${correctAnswer}" not found in options`)
    }

    // 3. Min 2 options, max 6
    if (options.length < 2 || options.length > 6) {
        errors.push(`Option count out of range: ${options.length} (expected 2-6)`)
    }

    return { valid: errors.length === 0, errors }
}
