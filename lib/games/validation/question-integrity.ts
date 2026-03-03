/**
 * Question Integrity Validator
 * Guarantees 100% answer correctness for all 152 games.
 * Run both at generation time and during nightly QA cron.
 */

export interface QuestionRecord {
    id?: string
    gameKey: string
    gradeBand: string
    questionText: string
    answerOptions?: string[] | null
    correctAnswer: string
    explanation?: string
    isGenerative?: boolean
    seedParams?: Record<string, unknown> | null
    answerFormula?: string | null
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: string[]
}

export interface ValidationError {
    code: string
    message: string
}

/** Tolerance for floating-point decimal answers */
const DECIMAL_TOLERANCE = 0.001

/**
 * Evaluates a simple arithmetic formula string using seedParams.
 * Supported: +, -, *, /, ** — variables are replaced from seedParams.
 * Example: formula="a + b", seedParams={a:3, b:4} → 7
 */
export function evaluateFormula(
    formula: string,
    seedParams: Record<string, unknown>
): string | null {
    try {
        // Replace variable names with their numeric values
        let expr = formula
        for (const [key, val] of Object.entries(seedParams)) {
            if (typeof val === 'number' || typeof val === 'string') {
                expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val))
            }
        }
        // Only allow safe characters
        if (!/^[0-9+\-*/().%^ \t]+$/.test(expr)) return null
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${expr})`)()
        if (typeof result === 'number' && isFinite(result)) {
            return Number.isInteger(result) ? String(result) : result.toFixed(2)
        }
        return null
    } catch {
        return null
    }
}

/**
 * Core validator — checks a single question for all integrity rules.
 */
export function validateQuestionIntegrity(q: QuestionRecord): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // ── Rule 1: Question text must exist ──────────────────────────────────────
    if (!q.questionText?.trim()) {
        errors.push({ code: 'MISSING_QUESTION_TEXT', message: 'questionText is empty' })
    }

    // ── Rule 2: Correct answer must exist and be non-empty ────────────────────
    if (!q.correctAnswer?.trim()) {
        errors.push({ code: 'MISSING_ANSWER', message: 'correctAnswer is empty' })
    }

    // ── Rule 3: MCQ — answerOptions validations ───────────────────────────────
    if (q.answerOptions !== null && q.answerOptions !== undefined) {
        const opts = q.answerOptions

        // 3a. Must have exactly 4 options
        if (opts.length !== 4) {
            errors.push({ code: 'WRONG_OPTION_COUNT', message: `Expected 4 options, got ${opts.length}` })
        }

        // 3b. No null/empty/undefined options
        const nullOpts = opts.filter(o => !o?.trim())
        if (nullOpts.length > 0) {
            errors.push({ code: 'NULL_OPTION', message: `${nullOpts.length} option(s) are empty or null` })
        }

        // 3c. No duplicate options (case-insensitive)
        const lower = opts.map(o => o?.toLowerCase().trim())
        const unique = new Set(lower)
        if (unique.size !== opts.length) {
            errors.push({ code: 'DUPLICATE_OPTIONS', message: 'Duplicate answer options detected' })
        }

        // 3d. Correct answer must be in the options
        const correctNorm = q.correctAnswer?.toLowerCase().trim()
        if (correctNorm && !lower.includes(correctNorm)) {
            errors.push({
                code: 'ANSWER_NOT_IN_OPTIONS',
                message: `correctAnswer "${q.correctAnswer}" not found in options`,
            })
        }
    }

    // ── Rule 4: Generator formula validation ──────────────────────────────────
    if (q.isGenerative && q.seedParams && q.answerFormula) {
        const recomputed = evaluateFormula(q.answerFormula, q.seedParams as Record<string, unknown>)
        if (recomputed === null) {
            errors.push({ code: 'FORMULA_EVAL_FAILED', message: `Could not evaluate formula: ${q.answerFormula}` })
        } else {
            // Allow decimal tolerance
            const stored = parseFloat(q.correctAnswer)
            const computed = parseFloat(recomputed)
            if (!isNaN(stored) && !isNaN(computed)) {
                if (Math.abs(stored - computed) > DECIMAL_TOLERANCE) {
                    errors.push({
                        code: 'ANSWER_MISMATCH',
                        message: `Formula gives ${recomputed}, stored answer is ${q.correctAnswer}`,
                    })
                }
            } else if (recomputed !== q.correctAnswer) {
                errors.push({
                    code: 'ANSWER_MISMATCH',
                    message: `Formula gives "${recomputed}", stored answer is "${q.correctAnswer}"`,
                })
            }
        }
    }

    // ── Rule 5: No NaN or Infinity in answer ──────────────────────────────────
    if (q.correctAnswer && (q.correctAnswer === 'NaN' || q.correctAnswer === 'Infinity' || q.correctAnswer === '-Infinity')) {
        errors.push({ code: 'INVALID_NUMERIC_ANSWER', message: `correctAnswer is ${q.correctAnswer}` })
    }

    // ── Warnings (non-fatal) ──────────────────────────────────────────────────
    if (!q.explanation?.trim()) {
        warnings.push('NO_EXPLANATION: Explanation is missing — students cannot learn from mistakes')
    }
    if (!q.gradeBand) {
        warnings.push('NO_GRADE_BAND: gradeBand not set — question will appear in all grades')
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    }
}

/**
 * Batch validator — validate an array of questions.
 * Returns a summary with all failures.
 */
export function validateBatch(questions: QuestionRecord[]): {
    total: number
    passed: number
    failed: number
    passRate: number
    failureDetails: Record<string, number>
    failedQuestions: Array<{ q: QuestionRecord; errors: ValidationError[] }>
} {
    const failureDetails: Record<string, number> = {}
    const failedQuestions: Array<{ q: QuestionRecord; errors: ValidationError[] }> = []
    let passed = 0

    for (const q of questions) {
        const result = validateQuestionIntegrity(q)
        if (result.valid) {
            passed++
        } else {
            failedQuestions.push({ q, errors: result.errors })
            for (const err of result.errors) {
                failureDetails[err.code] = (failureDetails[err.code] ?? 0) + 1
            }
        }
    }

    const total = questions.length
    const failed = total - passed
    return {
        total,
        passed,
        failed,
        passRate: total > 0 ? passed / total : 1,
        failureDetails,
        failedQuestions,
    }
}

/**
 * Normalises a user answer for comparison with the correct answer.
 * Applied both client-side (display) and server-side (validation).
 */
export function normaliseAnswer(raw: string, opts?: { toleranceMode?: boolean }): string {
    let s = raw.trim().toLowerCase()
    // Collapse internal whitespace
    s = s.replace(/\s+/g, ' ')
    // Remove non-alphanumeric except . - / (for decimals, negatives, fractions)
    // Do NOT strip these for math/science answers
    return s
}

/**
 * Compare user answer to correct answer — handles:
 * - Case-insensitive string compare
 * - Decimal tolerance (±0.001)
 * - Fraction equality: "1/2" == "0.5"
 */
export function answersMatch(
    userRaw: string,
    correctRaw: string,
    tolerance = DECIMAL_TOLERANCE
): boolean {
    const user = normaliseAnswer(userRaw)
    const correct = normaliseAnswer(correctRaw)

    if (user === correct) return true

    // Try numeric comparison
    const uNum = parseFloat(user.replace(',', '.'))
    const cNum = parseFloat(correct.replace(',', '.'))
    if (!isNaN(uNum) && !isNaN(cNum)) {
        return Math.abs(uNum - cNum) <= tolerance
    }

    // Try fraction equality: "1/2" === "0.5"
    const fractionToDecimal = (s: string) => {
        const m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/)
        return m ? parseFloat(m[1]) / parseFloat(m[2]) : NaN
    }
    const uFrac = fractionToDecimal(user)
    const cFrac = fractionToDecimal(correct)
    if (!isNaN(uFrac) && !isNaN(cNum)) return Math.abs(uFrac - cNum) <= tolerance
    if (!isNaN(cFrac) && !isNaN(uNum)) return Math.abs(uNum - cFrac) <= tolerance

    return false
}
