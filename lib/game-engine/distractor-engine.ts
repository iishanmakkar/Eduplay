/**
 * lib/game-engine/distractor-engine.ts
 *
 * PHASE 2 — Academic Distractor Engine
 *
 * Generates pedagogically valid distractors based on common student error patterns.
 * Distractors are NOT random — they reflect:
 *   - Sign errors
 *   - Wrong formula selection
 *   - Unit confusion
 *   - Off-by-one errors
 *   - Common misconceptions
 *   - Procedure errors (operating on numerator only, etc.)
 *
 * Used by: AI question generator, Content Lab bulk generation, admin audit tools
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DistractorSet {
    correctAnswer: string
    distractors: DistractorItem[]
}

export interface DistractorItem {
    value: string
    errorType: DistractorErrorType
    rationale: string  // Academic explanation of the student mistake
}

export type DistractorErrorType =
    | 'sign_error'                  // −a instead of +a
    | 'formula_substitution_error'  // Used wrong formula
    | 'wrong_operation'             // + instead of ×
    | 'unit_confusion'              // cm instead of m²
    | 'denominator_error'           // Added numerators and denominators separately (1/2+1/3=2/5)
    | 'off_by_one'                  // n-1 instead of n
    | 'incomplete_simplification'   // 4/8 instead of 1/2
    | 'decimal_shift'               // 1.2 instead of 12
    | 'order_confusion'             // Reversed dividend/divisor
    | 'missing_carry'               // Forgot to carry in addition
    | 'procedural_partial'          // Completed only first step
    | 'definition_confusion'        // Confused similar terms
    | 'memorisation_error'          // Common fact recalled incorrectly

// ── Core Generators ────────────────────────────────────────────────────────────

/**
 * Generate distractors for numeric answers (math games).
 * Returns exactly 3 distractors guaranteed to be distinct from correctAnswer.
 */
export function generateNumericDistractors(
    correctValue: number,
    topic: string,
    context: NumericContext = {}
): DistractorItem[] {
    const rules = NUMERIC_DISTRACTOR_RULES[topic] ?? NUMERIC_DISTRACTOR_RULES._default
    const distractors: DistractorItem[] = []

    for (const rule of rules) {
        const v = rule.generate(correctValue, context)
        if (v !== correctValue && isFinite(v) && !isNaN(v)) {
            distractors.push({
                value: formatNumber(v, context.decimalPlaces),
                errorType: rule.errorType,
                rationale: rule.rationale(correctValue, v),
            })
        }
        if (distractors.length >= 3) break
    }

    // Fill remaining slots with arithmetic-near values
    while (distractors.length < 3) {
        const offset = distractors.length === 0 ? 1 : distractors.length + 1
        const v = correctValue + offset
        if (v !== correctValue) {
            distractors.push({
                value: formatNumber(v, context.decimalPlaces),
                errorType: 'off_by_one',
                rationale: `Off by ${offset} — common counting or carrying error`,
            })
        }
    }

    return distractors.slice(0, 3)
}

export interface NumericContext {
    decimalPlaces?: number
    isNegativeExpected?: boolean
    units?: string
}

function formatNumber(n: number, decimals?: number): string {
    if (decimals !== undefined) return n.toFixed(decimals)
    return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

// ── Distractor Rules by Topic ──────────────────────────────────────────────────

type DistractorRule = {
    errorType: DistractorErrorType
    generate: (correct: number, ctx: NumericContext) => number
    rationale: (correct: number, distractor: number) => string
}

const NUMERIC_DISTRACTOR_RULES: Record<string, DistractorRule[]> = {
    // ── Fractions ──────────────────────────────────────────────────────────────
    fractions: [
        {
            errorType: 'denominator_error',
            generate: (c, _ctx) => Math.round((c + 0.1) * 10) / 10,  // Partial fraction add error
            rationale: (c, d) => `Student added numerators and denominators separately (e.g., 1/2+1/3=2/5 instead of ${c}), getting ${d}`,
        },
        {
            errorType: 'incomplete_simplification',
            generate: (c, _ctx) => Math.round(c * 2 * 10) / 10,  // Unsimplified form multiplied up
            rationale: (c, d) => `Student found an equivalent fraction (${d}) but failed to simplify to lowest terms (${c})`,
        },
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => Math.round((c - 0.25) * 100) / 100,  // Subtracted instead of added
            rationale: (c, d) => `Student subtracted instead of added the fractions, arriving at ${d} instead of ${c}`,
        },
    ],

    // ── Multiplication ─────────────────────────────────────────────────────────
    multiplication: [
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => {
                // Reverse-engineer approximate addend and add instead
                const approxFactor = Math.round(Math.sqrt(c))
                return approxFactor * 2
            },
            rationale: (c, d) => `Student added the factors instead of multiplying, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'decimal_shift',
            generate: (c, _ctx) => c / 10,
            rationale: (c, d) => `Student misplaced the decimal point, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'missing_carry',
            generate: (c, _ctx) => c - 10,
            rationale: (c, d) => `Student forgot to carry during multiplication, reducing the answer by ~10, getting ${d} instead of ${c}`,
        },
    ],

    // ── Division ───────────────────────────────────────────────────────────────
    division: [
        {
            errorType: 'order_confusion',
            generate: (c, _ctx) => Math.round((1 / c) * 100) / 100,
            rationale: (c, d) => `Student reversed dividend and divisor (computed reciprocal), getting ${d} instead of ${c}`,
        },
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => c * 2,
            rationale: (c, d) => `Student multiplied instead of dividing, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'decimal_shift',
            generate: (c, _ctx) => c * 10,
            rationale: (c, d) => `Student misplaced the decimal when dividing, getting ${d} instead of ${c}`,
        },
    ],

    // ── Percentages ────────────────────────────────────────────────────────────
    percentages: [
        {
            errorType: 'formula_substitution_error',
            generate: (c, _ctx) => c * 100,  // Forgot to ÷100
            rationale: (c, d) => `Student forgot to divide by 100 when converting percentage to decimal, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'procedural_partial',
            generate: (c, _ctx) => Math.round(c / 2),
            rationale: (c, d) => `Student computed only half the percentage (found 50% of the correct answer), getting ${d} instead of ${c}`,
        },
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => c + 100,
            rationale: (c, d) => `Student added the percentage to the base instead of computing it, getting ${d} instead of ${c}`,
        },
    ],

    // ── Algebra ────────────────────────────────────────────────────────────────
    algebra: [
        {
            errorType: 'sign_error',
            generate: (c, _ctx) => -c,
            rationale: (c, d) => `Student made a sign error when transposing terms, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'formula_substitution_error',
            generate: (c, _ctx) => c + 2,
            rationale: (c, d) => `Student correctly rearranged but made an arithmetic slip in the last step, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => c * 2,
            rationale: (c, d) => `Student doubled the solution (common error when coefficient is ½), getting ${d} instead of ${c}`,
        },
    ],

    // ── Area & Mensuration ─────────────────────────────────────────────────────
    mensuration: [
        {
            errorType: 'formula_substitution_error',
            generate: (c, _ctx) => c * 2,
            rationale: (c, d) => `Student confused area formula with perimeter formula, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'unit_confusion',
            generate: (c, _ctx) => Math.round(Math.sqrt(c) * 10) / 10,
            rationale: (c, d) => `Student forgot to square the unit or took square root of area, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'procedural_partial',
            generate: (c, _ctx) => Math.round(c / 2),
            rationale: (c, d) => `Student used ½ × base × height for rectangle or skipped the π factor, getting ${d} instead of ${c}`,
        },
    ],

    // ── Integers / Negative Numbers ────────────────────────────────────────────
    integers: [
        {
            errorType: 'sign_error',
            generate: (c, _ctx) => -c,
            rationale: (c, d) => `Student ignored the sign rules for negative numbers, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'wrong_operation',
            generate: (c, _ctx) => Math.abs(c),
            rationale: (c, d) => `Student dropped the negative sign (took absolute value), getting ${d} instead of ${c}`,
        },
        {
            errorType: 'procedural_partial',
            generate: (c, _ctx) => c + 2,
            rationale: (c, d) => `Student added instead of subtracted a negative (common confusion), getting ${d} instead of ${c}`,
        },
    ],

    // ── Statistics ──────────────────────────────────────────────────────────────
    statistics: [
        {
            errorType: 'definition_confusion',
            generate: (c, _ctx) => Math.round(c * 1.1),
            rationale: (c, d) => `Student confused mean with median or mode, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'procedural_partial',
            generate: (c, _ctx) => Math.round(c / 2),
            rationale: (c, d) => `Student summed the values but forgot to divide by n (count), getting ${d} instead of ${c}`,
        },
        {
            errorType: 'off_by_one',
            generate: (c, _ctx) => c + 1,
            rationale: (c, d) => `Student included/excluded a boundary data point, off by one step, getting ${d} instead of ${c}`,
        },
    ],

    // ── Default fallback ────────────────────────────────────────────────────────
    _default: [
        {
            errorType: 'off_by_one',
            generate: (c) => c + 1,
            rationale: (c, d) => `Arithmetic slip — off by 1, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'sign_error',
            generate: (c) => -c,
            rationale: (c, d) => `Sign error in a transposition step, getting ${d} instead of ${c}`,
        },
        {
            errorType: 'decimal_shift',
            generate: (c) => c * 10,
            rationale: (c, d) => `Decimal point misplaced, getting ${d} instead of ${c}`,
        },
    ],
}

// ── MCQ Text Distractor Validator ──────────────────────────────────────────────

/**
 * Validates whether an MCQ option set meets academic distractor quality standards.
 * Returns an array of issues (empty = passing).
 */
export function validateMCQDistractors(
    correctAnswer: string,
    options: string[]
): string[] {
    const issues: string[] = []
    const lower = options.map(o => o.trim().toLowerCase())
    const correctLower = correctAnswer.trim().toLowerCase()

    // Correct answer must be present
    if (!lower.includes(correctLower)) {
        issues.push(`correctAnswer "${correctAnswer}" is not in options`)
    }

    // No duplicates
    if (new Set(lower).size < lower.length) {
        issues.push('Duplicate options detected')
    }

    // No invalid catch-all options
    const banned = ['all of the above', 'none of the above', 'both a and b', 'both a & b', 'cannot be determined']
    for (const opt of lower) {
        if (banned.some(b => opt.includes(b))) {
            issues.push(`Banned generic option: "${opt}"`)
        }
    }

    // Exactly 4 options
    if (options.length !== 4) {
        issues.push(`Expected exactly 4 options, got ${options.length}`)
    }

    // No blank options
    for (const opt of options) {
        if (!opt.trim()) issues.push('Blank option detected')
    }

    return issues
}

// ── AI Prompt Distractor Instructions ─────────────────────────────────────────

/**
 * Returns topic-specific distractor guidance for embedding in AI prompts.
 * This ensures AI-generated questions have pedagogically sound wrong answers.
 */
export function getDistractorPromptGuidance(topic: string, gradeBand: string): string {
    const rules: Record<string, string> = {
        fractions: `Distractors must reflect: (1) adding numerators AND denominators separately e.g. 1/2+1/3=2/5, (2) forgetting to simplify the result, (3) wrong LCD calculation. NOT random numbers.`,
        algebra: `Distractors must reflect: (1) sign error when transposing (moving +x becomes +x not -x), (2) coefficient error by double or half, (3) arithmetic slip in final step. NOT random.`,
        percentages: `Distractors must reflect: (1) forgetting to ÷100 (using 25 instead of 0.25), (2) computing percentage OF the percent not the base, (3) adding percentage to base directly. NOT random.`,
        multiplication: `Distractors must reflect: (1) adding instead of multiplying, (2) carrying error (off by 10 or 100), (3) positional value confusion. NOT random.`,
        division: `Distractors must reflect: (1) reversing dividend and divisor, (2) multiplying instead of dividing, (3) stopping at quotient without remainder. NOT random.`,
        mensuration: `Distractors must reflect: (1) using perimeter formula for area, (2) using diameter instead of radius, (3) forgetting π or squaring. NOT random.`,
        integers: `Distractors must reflect: (1) sign reversal when subtracting negatives, (2) ignoring sign (absolute value), (3) wrong sign in product of two negatives. NOT random.`,
        statistics: `Distractors must reflect: (1) confusing mean with median, (2) summing without dividing, (3) off-by-one in range/mode detection. NOT random.`,
        trigonometry: `Distractors must reflect: (1) sin/cos confusion, (2) using degrees instead of radians (or vice versa), (3) reciprocal identity confusion (sin vs cosec). NOT random.`,
        _default: `Distractors must reflect common student mistakes: sign errors, wrong formula, procedural errors, not random numbers. Each distractor should represent a realistic student error.`,
    }

    const key = Object.keys(rules).find(k => topic.toLowerCase().includes(k)) ?? '_default'
    const base = rules[key]

    const gradeNote: Record<string, string> = {
        KG2: 'Distractors must use numbers 1–20 only, visually distinct.',
        '35': 'Distractors must be numerically plausible within Grade 3–5 range.',
        '68': 'Distractors should reflect multi-step procedure errors.',
        '912': 'Distractors should reflect symbolic and conceptual errors appropriate for board exam level.',
    }

    return `${base} ${gradeNote[gradeBand] ?? ''}`
}
