/**
 * Answer Correctness Guarantee
 * lib/game-engine/answer-validator.ts
 *
 * Unified answer normalization + comparison for all 25 game types.
 * Each game type uses a named strategy to ensure consistent,
 * unambiguous correctness checking.
 *
 * Validation rules by game type:
 *   MATH games       → numeric comparison with ±0.01 decimal tolerance
 *   TEXT games       → trim + lowercase + collapse whitespace
 *   SEQUENCE games   → ordered array comparison
 *   MEMORY games     → pair integrity verification (no orphaned cards)
 *   WORD games       → normalized string, allowing hyphenated forms
 *   TYPING games     → character-accurate normalized comparison
 */

export type AnswerMatchType =
    | 'exact'
    | 'decimal_tolerance'
    | 'fraction_equivalent'
    | 'plus_minus'
    | 'case_insensitive'
    | 'multi_answer'
    | 'sequence'
    | 'failed'

export interface AnswerValidation {
    isCorrect: boolean
    normalizedSubmitted: string
    normalizedCorrect: string
    matchType: AnswerMatchType
    details?: string
}

export type GameAnswerStrategy =
    | 'math_numeric'        // SpeedMath, MathGrid, MathGridSudoku
    | 'math_fraction'       // Fraction-based games: 1/2 == 2/4
    | 'math_plus_minus'     // ±3 matches ±3, -3, or 3 depending on context
    | 'text_exact'          // ScienceQuiz, WorldFlags
    | 'text_multi'          // CodeBreaker, RiddleSprint (multiple valid answers)
    | 'sequence_ordered'    // PatternSequence, SequenceBuilder
    | 'typing_exact'        // TypingSpeed, KidsTypingTutor
    | 'word_scramble'       // WordScramble
    | 'memory_pair'         // MemoryMatch, MemoryMatrix, MemoryGridAdvanced
    | 'logic_choice'        // LogicPuzzle, LogicGrid, AttentionSwitch
    | 'generic_choice'      // All MCQ games: case-insensitive string match

// Map game types to their validation strategy
export const GAME_STRATEGY_MAP: Record<string, GameAnswerStrategy> = {
    // ── Legacy cognitive/mind games ──────────────────────────────────────────
    SPEED_MATH: 'math_numeric',
    MATH_GRID: 'math_numeric',
    MATH_SUDOKU: 'math_numeric',
    SCIENCE_QUIZ: 'text_exact',
    WORLD_FLAGS: 'text_exact',
    CODE_BREAKER: 'text_multi',
    RIDDLE_SPRINT: 'text_multi',
    ANALOGIES: 'text_multi',
    PATTERN_SEQUENCE: 'sequence_ordered',
    SEQUENCE_BUILDER: 'sequence_ordered',
    TYPING_SPEED: 'typing_exact',
    KIDS_TYPING: 'typing_exact',
    WORD_SCRAMBLE: 'word_scramble',
    MEMORY_MATCH: 'memory_pair',
    MEMORY_MATRIX: 'memory_pair',
    MEMORY_GRID_ADV: 'memory_pair',
    LOGIC_PUZZLE: 'logic_choice',
    LOGIC_GRID: 'logic_choice',
    FOCUS_CHALLENGE: 'logic_choice',
    ATTENTION_SWITCH: 'logic_choice',
    COLOR_MATCH: 'generic_choice',
    VISUAL_ROTATION: 'generic_choice',
    SHAPE_CONSTRUCTOR: 'generic_choice',
    MINI_STRATEGY: 'generic_choice',
    STRATEGY_BUILDER: 'generic_choice',
    CREATIVE_STORY: 'text_multi',
    TIME_PLANNER: 'logic_choice',

    // ── Mathematics (150+ procedural games) ──────────────────────────────────
    NUMBER_CATERPILLAR: 'math_numeric',
    HOT_AIR_BALLOON_RACE: 'math_numeric',
    APPLE_ORCHARD_COLLECTOR: 'math_numeric',
    FISH_TANK_FILL: 'math_numeric',
    SHAPE_SORTER_CITY: 'generic_choice',
    PIZZA_SLICE_WARS: 'math_fraction',
    DECIMAL_DODGE: 'math_numeric',
    MARKET_MAYHEM: 'math_numeric',
    FACTOR_FORTRESS: 'generic_choice',
    FRACTION_ARROW_ARCHER: 'math_fraction',
    RATIO_RAIL_RUSH: 'generic_choice',
    MULTIPLIER_MAYHEM: 'math_numeric',
    ANGLE_ASSASSIN: 'generic_choice',
    ALGEBRA_WAVE_SURFER: 'math_numeric',
    AREA_CONSTRUCTOR: 'math_numeric',
    INTEGER_ICE_BATTLE: 'math_numeric',
    DATA_DETECTIVE: 'math_numeric',
    PROBABILITY_POKER: 'math_fraction',
    COORDINATE_COMBAT: 'generic_choice',
    POLYNOMIAL_PACKAGER: 'generic_choice',
    CALCULUS_CLIFF: 'generic_choice',
    QUADRATIC_QUEST: 'math_plus_minus',
    TRIG_BRIDGE_BUILDER: 'generic_choice',
    MATRIX_MORPH_DUEL: 'math_numeric',
    INTEGRAL_INVADER: 'generic_choice',
    VECTOR_SPACE_VOYAGER: 'generic_choice',
    STATISTICS_STOCK_PROPHET: 'math_numeric',
    NUMBER_THEORY_VAULT: 'generic_choice',
    COMPLEX_NAVIGATOR: 'generic_choice',
    PERMUTATION_COASTER: 'math_numeric',
    SURVEYORS_SPRINT: 'generic_choice',

    // ── English ───────────────────────────────────────────────────────────────
    SYNONYM_SWITCHBLADE: 'generic_choice',
    GRAMMAR_GLADIATOR: 'generic_choice',
    IDIOM_HUNTER: 'generic_choice',
    COMPREHENSION_CODEBREAKER: 'generic_choice',
    PHONICS_POND_HOP: 'generic_choice',
    LETTER_LASSO: 'generic_choice',
    VOWEL_VILLAGE: 'generic_choice',
    TENSE_TREKKER: 'generic_choice',
    PUNCTUATION_RUSH: 'generic_choice',
    ESSAY_ENGINEER: 'generic_choice',
    PARTS_OF_SPEECH_DUEL: 'generic_choice',
    SHAKESPEARE_SHOWDOWN: 'generic_choice',

    // ── Science ───────────────────────────────────────────────────────────────
    PERIODIC_BATTLESHIP: 'generic_choice',
    ANIMAL_KINGDOM_SORTER: 'generic_choice',
    SOLAR_SYSTEM_DEFENDER: 'generic_choice',
    GENETICS_GENOME_DUEL: 'generic_choice',
    FOOD_CHAIN_ARENA: 'generic_choice',
    PLANT_POWER_GROWER: 'generic_choice',
    FORCE_MOTION_DOJO: 'generic_choice',
    ELECTROSTATICS_ARENA: 'generic_choice',
    EVOLUTION_ISLAND: 'generic_choice',
    CHEMISTRY_CAULDRON: 'generic_choice',
    CELL_DIVISION_DASH: 'generic_choice',
    WAVE_FREQUENCY_FIGHTER: 'generic_choice',
    OPTICS_OBSTACLE_COURSE: 'generic_choice',
    HUMAN_BODY_BLITZ: 'generic_choice',
    ECOLOGY_EXPEDITION: 'generic_choice',

    // ── Social Studies ───────────────────────────────────────────────────────
    CAPITALS_CONQUEST: 'generic_choice',
    CIVILIZATION_BUILDER: 'generic_choice',
    EMPIRE_FALL: 'generic_choice',
    DEMOCRACY_DEBATE: 'generic_choice',
    TRADE_ROUTE_TYCOON: 'generic_choice',
    MAP_MASTERY_MISSION: 'generic_choice',
    GEOSPY: 'generic_choice',
    TIMELINE_BLITZ: 'generic_choice',
    GEOGRAPHY_GLADIATOR: 'generic_choice',

    // ── Computer Science ─────────────────────────────────────────────────────
    BINARY_BLASTER: 'math_numeric',
    CYBER_SHIELD: 'generic_choice',
    DEBUG_DUEL: 'generic_choice',
    LOGIC_GATE_GARDEN: 'generic_choice',
    ENCRYPTION_ESCAPE: 'generic_choice',
    AI_TRAINING_GROUND: 'generic_choice',
    SORTING_RACE: 'generic_choice',
    ALGORITHM_ARENA: 'generic_choice',
    RECURSION_REALM: 'generic_choice',
    DATA_STRUCTURES_DUEL: 'generic_choice',
    WEB_WEAVER: 'generic_choice',

    // ── GK & Life Skills ─────────────────────────────────────────────────────
    INVENTORS_WORKSHOP: 'generic_choice',
    OLYMPIAD_QUALIFIER: 'generic_choice',
    CRITICAL_THINKERS_COURT: 'generic_choice',
    BUDGET_BATTLE: 'generic_choice',
    SHOP_IT_UP: 'generic_choice',
    EQ_MAZE: 'generic_choice',
    SCIENCE_OLYMPIAD: 'generic_choice',
    NEWS_NINJA: 'generic_choice',

    // ── Hindi ────────────────────────────────────────────────────────────────
    SHABDKOSH_SPRINT: 'generic_choice',
    VARNAMALA_VILLAGE: 'generic_choice',
    VYAKARAN_WARRIOR: 'generic_choice',
    HINDI_STORY_BUILDER: 'generic_choice',
    MATRA_MATCH: 'generic_choice',
    SANDHI_SHOWDOWN: 'generic_choice',
    MUHAVARE_MANIA: 'generic_choice',
    DOHE_KI_DAUD: 'generic_choice',
}

// ── Normalization helpers ─────────────────────────────────────────────────────

/** Standard text normalization: trim, lowercase, collapse internal whitespace, unicode normalize. */
export function normalizeText(raw: string): string {
    // NFD + remove diacritics → handles accented characters
    // Then normalize to NFC for consistent comparison
    const diacriticStripped = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    return diacriticStripped.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Numeric normalization: parse float, handle sign, comma separators. */
export function normalizeNumeric(raw: string): number {
    const cleaned = raw.trim().replace(/,/g, '').replace(/\s/g, '')
    const parsed = parseFloat(cleaned)
    return Object.is(parsed, -0) ? 0 : parsed
}

/**
 * Fraction normalization: returns numerator/denominator as [n, d] in lowest terms.
 * Handles both "3/4" and plain integers (treated as n/1).
 */
function parseFraction(raw: string): [number, number] | null {
    const s = raw.trim()
    const slashIdx = s.indexOf('/')
    if (slashIdx === -1) {
        const n = parseFloat(s)
        return isNaN(n) ? null : [n, 1]
    }
    const n = parseFloat(s.slice(0, slashIdx))
    const d = parseFloat(s.slice(slashIdx + 1))
    if (isNaN(n) || isNaN(d) || d === 0) return null
    return [n, d]
}

function gcdOf(a: number, b: number): number {
    a = Math.abs(a); b = Math.abs(b)
    while (b) { [a, b] = [b, a % b] }
    return a
}

/** Returns true if two fraction strings are mathematically equal (cross-multiply). */
export function fractionsEqual(a: string, b: string): boolean {
    const fa = parseFraction(a)
    const fb = parseFraction(b)
    if (!fa || !fb) return false
    // cross-multiplication: n1/d1 == n2/d2 iff n1*d2 == n2*d1
    return Math.round(fa[0] * fb[1] * 1e6) === Math.round(fb[0] * fa[1] * 1e6)
}

/**
 * Simplify a fraction string to lowest terms for display.
 * "6/4" → "3/2"
 */
export function simplifyFraction(raw: string): string {
    const f = parseFraction(raw)
    if (!f) return raw
    const g = gcdOf(f[0], f[1])
    return g === 0 ? raw : `${f[0] / g}/${f[1] / g}`
}

// ── Validation strategies ─────────────────────────────────────────────────────

function validateMathNumeric(submitted: string, correct: string): AnswerValidation {
    // First try fraction equivalence (e.g. 1/2 == 0.5)
    if (submitted.includes('/') || correct.includes('/')) {
        return validateMathFraction(submitted, correct)
    }

    const submittedNum = normalizeNumeric(submitted)
    const correctNum = normalizeNumeric(correct)

    if (!isFinite(submittedNum) || isNaN(submittedNum)) {
        return {
            isCorrect: false,
            normalizedSubmitted: submitted,
            normalizedCorrect: correct,
            matchType: 'failed',
            details: 'Submitted value is not a valid finite number'
        }
    }
    if (!isFinite(correctNum) || isNaN(correctNum)) {
        return {
            isCorrect: false,
            normalizedSubmitted: String(submittedNum),
            normalizedCorrect: correct,
            matchType: 'failed',
            details: 'Correct answer is not a valid finite number — generator bug'
        }
    }

    const tolerance = 0.01
    const isCorrect = Math.abs(submittedNum - correctNum) <= tolerance

    return {
        isCorrect,
        normalizedSubmitted: String(submittedNum),
        normalizedCorrect: String(correctNum),
        matchType: 'decimal_tolerance',
        details: `|${submittedNum} − ${correctNum}| = ${Math.abs(submittedNum - correctNum).toFixed(4)} (tolerance: ±${tolerance})`
    }
}

/**
 * Fraction strategy: 1/2 == 2/4 == 0.50.
 * Handles mixed input like "0.5" vs "1/2".
 */
function validateMathFraction(submitted: string, correct: string): AnswerValidation {
    // Try cross-multiply equivalence first
    if (fractionsEqual(submitted, correct)) {
        return {
            isCorrect: true,
            normalizedSubmitted: simplifyFraction(submitted),
            normalizedCorrect: simplifyFraction(correct),
            matchType: 'fraction_equivalent'
        }
    }
    // Fall back to decimal comparison (handles "0.5" vs "1/2")
    const sn = submitted.includes('/') ? (() => { const f = parseFraction(submitted); return f ? f[0] / f[1] : NaN })() : normalizeNumeric(submitted)
    const cn = correct.includes('/') ? (() => { const f = parseFraction(correct); return f ? f[0] / f[1] : NaN })() : normalizeNumeric(correct)
    if (!isFinite(sn) || !isFinite(cn)) {
        return { isCorrect: false, normalizedSubmitted: submitted, normalizedCorrect: correct, matchType: 'failed', details: 'Could not parse as fraction or decimal' }
    }
    const isCorrect = Math.abs(sn - cn) <= 0.01
    return { isCorrect, normalizedSubmitted: String(sn), normalizedCorrect: String(cn), matchType: 'fraction_equivalent' }
}

/**
 * Plus-minus strategy: submitted "±3" matches correct "±3", "+3", "-3", or "3".
 * Used for quadratic roots like x²=9 → x=±3.
 */
function validateMathPlusMinus(submitted: string, correct: string): AnswerValidation {
    const norm = (s: string) => s.trim().replace(/\s/g, '').toLowerCase()
    const sn = norm(submitted), cn = norm(correct)
    // Direct match
    if (sn === cn) return { isCorrect: true, normalizedSubmitted: sn, normalizedCorrect: cn, matchType: 'plus_minus' }
    // Strip ± to get the magnitude
    const magnitude = (s: string) => s.replace(/^[±+-]+/, '')
    const isCorrect = magnitude(sn) === magnitude(cn)
    return { isCorrect, normalizedSubmitted: sn, normalizedCorrect: cn, matchType: 'plus_minus', details: `Magnitude comparison: ${magnitude(sn)} vs ${magnitude(cn)}` }
}

function validateTextExact(submitted: string, correct: string): AnswerValidation {
    const norm = normalizeText(submitted)
    const correctNorm = normalizeText(correct)
    return {
        isCorrect: norm === correctNorm,
        normalizedSubmitted: norm,
        normalizedCorrect: correctNorm,
        matchType: 'case_insensitive'
    }
}

/**
 * Multi-answer: `correct` is a pipe-separated list of valid answers.
 * e.g. correct = "cat|cats|the cat"
 */
function validateTextMulti(submitted: string, correct: string): AnswerValidation {
    const norm = normalizeText(submitted)
    const validAnswers = correct.split('|').map(normalizeText)
    const isCorrect = validAnswers.some(v => v === norm)
    return {
        isCorrect,
        normalizedSubmitted: norm,
        normalizedCorrect: validAnswers.join(' | '),
        matchType: 'multi_answer',
        details: `Checked against ${validAnswers.length} valid answer(s)`
    }
}

/**
 * Typing exact: character-by-character comparison after normalization.
 * No case-insensitivity — typing games require exact case.
 */
function validateTypingExact(submitted: string, correct: string): AnswerValidation {
    const norm = submitted.trim()
    const correctNorm = correct.trim()
    return {
        isCorrect: norm === correctNorm,
        normalizedSubmitted: norm,
        normalizedCorrect: correctNorm,
        matchType: 'exact'
    }
}

/**
 * Word scramble: normalized case-insensitive comparison.
 * Allows hyphenated variants: "good-bye" === "goodbye".
 */
function validateWordScramble(submitted: string, correct: string): AnswerValidation {
    const norm = normalizeText(submitted).replace(/-/g, '')
    const correctNorm = normalizeText(correct).replace(/-/g, '')
    return {
        isCorrect: norm === correctNorm,
        normalizedSubmitted: norm,
        normalizedCorrect: correctNorm,
        matchType: 'case_insensitive'
    }
}

/**
 * Sequence ordered: submitted is JSON array of strings/numbers, must match correct order.
 */
function validateSequence(submitted: string, correct: string): AnswerValidation {
    try {
        const submittedArr: unknown[] = JSON.parse(submitted)
        const correctArr: unknown[] = JSON.parse(correct)

        const isCorrect = JSON.stringify(submittedArr) === JSON.stringify(correctArr)
        return {
            isCorrect,
            normalizedSubmitted: JSON.stringify(submittedArr),
            normalizedCorrect: JSON.stringify(correctArr),
            matchType: 'sequence'
        }
    } catch {
        return {
            isCorrect: false,
            normalizedSubmitted: submitted,
            normalizedCorrect: correct,
            matchType: 'failed',
            details: 'Could not parse sequence as JSON array'
        }
    }
}

/**
 * Memory pair integrity check.
 * `pairs` must be an even-length array where each value appears exactly twice.
 */
export function validateMemoryPairIntegrity(cards: string[]): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (cards.length % 2 !== 0) {
        errors.push(`Odd number of cards: ${cards.length}. Memory games require even card count.`)
    }

    const counts: Record<string, number> = {}
    for (const card of cards) {
        counts[card] = (counts[card] || 0) + 1
    }

    for (const [card, count] of Object.entries(counts)) {
        if (count !== 2) {
            errors.push(`Card "${card}" appears ${count} time(s) — must appear exactly 2 times.`)
        }
    }

    return { valid: errors.length === 0, errors }
}

// ── Main validator ────────────────────────────────────────────────────────────

/**
 * Primary answer validation entry point.
 * Route to the correct strategy based on gameType.
 *
 * @param submitted   - Raw string from student input
 * @param correct     - Canonical correct answer string (server-side)
 * @param gameType    - Determines validation strategy
 */
export function validateAnswer(
    submitted: string,
    correct: string,
    gameType: string
): AnswerValidation {
    const strategy = GAME_STRATEGY_MAP[gameType] ?? 'generic_choice'

    switch (strategy) {
        case 'math_numeric':
            return validateMathNumeric(submitted, correct)
        case 'math_fraction':
            return validateMathFraction(submitted, correct)
        case 'math_plus_minus':
            return validateMathPlusMinus(submitted, correct)
        case 'text_exact':
        case 'logic_choice':
        case 'generic_choice':
            return validateTextExact(submitted, correct)
        case 'text_multi':
            return validateTextMulti(submitted, correct)
        case 'typing_exact':
            return validateTypingExact(submitted, correct)
        case 'word_scramble':
            return validateWordScramble(submitted, correct)
        case 'sequence_ordered':
            return validateSequence(submitted, correct)
        case 'memory_pair':
            return validateTextExact(submitted, correct)
        default:
            return validateTextExact(submitted, correct)
    }
}

/**
 * Batch validate multiple answers (for classroom session scoring).
 * Returns per-question results.
 */
export function validateAnswerBatch(
    submissions: Array<{ questionIndex: number; submitted: string; correct: string }>,
    gameType: string
): Array<AnswerValidation & { questionIndex: number }> {
    return submissions.map(s => ({
        questionIndex: s.questionIndex,
        ...validateAnswer(s.submitted, s.correct, gameType)
    }))
}

/**
 * Phase 3 — Console Audit Trace
 * Validates and logs full comparison trace for debugging wrong-answer reports.
 * Use in server API routes to diagnose client/server mismatches.
 */
export function validateAnswerWithTrace(
    questionId: string,
    userAnswer: string,
    correctAnswer: string,
    gameType: string
): AnswerValidation {
    const result = validateAnswer(userAnswer, correctAnswer, gameType)

    // Structured audit trace — always emitted server-side for wrong answers
    if (!result.isCorrect || process.env.NODE_ENV === 'development') {
        const trace = {
            questionId,
            gameType,
            strategy: GAME_STRATEGY_MAP[gameType] ?? 'generic_choice',
            userAnswer,
            normalizedUser: result.normalizedSubmitted,
            expectedAnswer: correctAnswer,
            normalizedExpected: result.normalizedCorrect,
            comparisonResult: result.isCorrect ? 'CORRECT' : 'INCORRECT',
            matchType: result.matchType,
            details: result.details ?? null,
        }
        if (!result.isCorrect) {
            console.warn('[ANSWER_AUDIT] Incorrect answer:', JSON.stringify(trace))
        } else {
            console.debug('[ANSWER_AUDIT] Correct answer:', JSON.stringify(trace))
        }
    }

    return result
}

/**
 * Phase 3 — MCQ safety: validate by string VALUE, never by array index.
 *
 * Root cause of MCQ marking bug: some game components compare selected option INDEX
 * rather than option VALUE. This function enforces value-based comparison.
 *
 * @param selectedOptionText  - The text of the option the user clicked
 * @param correctAnswerText   - The text of the correct answer (from DB)
 * @param allOptions          - Full options array (used for fallback index resolution)
 */
export function validateMCQByValue(
    selectedOptionText: string,
    correctAnswerText: string,
    allOptions?: string[]
): AnswerValidation {
    // Primary: direct value comparison
    const primary = validateTextExact(selectedOptionText, correctAnswerText)
    if (primary.isCorrect) return { ...primary, details: 'MCQ value match' }

    // Fallback: if selectedOptionText looks like a number, try index-to-value resolution
    if (allOptions && allOptions.length > 0) {
        const idx = parseInt(selectedOptionText)
        if (!isNaN(idx) && idx >= 0 && idx < allOptions.length) {
            const resolvedValue = allOptions[idx]
            const fallback = validateTextExact(resolvedValue, correctAnswerText)
            if (fallback.isCorrect) {
                return {
                    ...fallback,
                    details: `MCQ index fallback: index ${idx} → "${resolvedValue}"`,
                }
            }
        }
    }

    return {
        isCorrect: false,
        normalizedSubmitted: normalizeText(selectedOptionText),
        normalizedCorrect: normalizeText(correctAnswerText),
        matchType: 'failed',
        details: `MCQ mismatch: "${selectedOptionText}" ≠ "${correctAnswerText}"`,
    }
}


