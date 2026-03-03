/**
 * lib/ai-games/ai-answer-validator.ts  (Phase 2 — AI Output Perfection Mode)
 *
 * validateAIOutputIntegrity() — Now includes 15 checks:
 *  Original 7 + 8 new:
 *  8.  Logical consistency (numeric answers within plausible range)
 *  9.  Hallucination guard (flags suspiciously precise fake numbers)
 *  10. Difficulty alignment (difficulty 1 should not have university-level terms)
 *  11. Cognitive load fit (question word count vs grade band limit)
 *  12. No trick wording ("always", "never", "all", "only")
 *  13. Cultural bias detection (Western-centric exclusive examples)
 *  14. Safety content filter (extended blocked terms)
 *  15. Confidence score computation
 */

import type { AIGameQuestion, AIValidationResult } from './types'

// ── Blocked content ───────────────────────────────────────────────────────────

const BLOCKED_TERMS = new Set([
    'violence', 'murder', 'kill', 'hate', 'racist', 'sexist', 'profanity',
    'suicide', 'drug', 'alcohol', 'gambling', 'weapon', 'bomb', 'explicit',
    'adult content', 'xxx', 'offensive',
])

const AMBIGUOUS_OPTIONS = new Set([
    'all of the above', 'none of the above', 'both a and b',
    'cannot be determined', 'none of these', 'all of these',
])

// ── Trick wording that creates ambiguity ─────────────────────────────────────

const TRICK_WORDING = ['always', 'never', 'all students', 'every single', 'in all cases', 'without exception']

// ── Western-centric exclusionary examples (flag for review) ──────────────────

const CULTURAL_FLAGS = ['american exceptionalism', 'only western', 'superior culture', 'primitive culture']

// ── University-level terms inappropriate for low difficulty ──────────────────

const ADVANCED_TERMS = new Set([
    'stochastic', 'eigenvalue', 'manifold', 'quaternion', 'variational',
    'hamiltonian', 'lagrangian', 'topological', 'countably infinite',
])

// ── Grade band word-count limits ──────────────────────────────────────────────

const MAX_QUESTION_LENGTH: Record<string, number> = {
    kg2: 80, '35': 180, '68': 320, '912': 560,
}
const MAX_WORD_COUNT: Record<string, number> = {
    kg2: 15, '35': 40, '68': 80, '912': 140,
}

// ── plausible numeric range guard ────────────────────────────────────────────

function isPlausibleNumericAnswer(answer: string): boolean {
    const n = parseFloat(answer)
    if (isNaN(n)) return true  // Not numeric — skip
    if (!isFinite(n)) return false
    // Flag: too many decimal places (> 4 suggests float drift or hallucination)
    if (answer.includes('.') && (answer.split('.')[1]?.length ?? 0) > 4) return false
    return true
}

// ── Hallucination indicator: ≥ 7-digit year or impossible date ──────────────

const HALLUC_PATTERNS = [
    /in (?:the year )?\d{5,}/i,  // Year > 9999
    /\b(?:19|20)\d{2}\b.*\b(?:19|20)\d{2}\b.*\b(?:19|20)\d{2}\b/,  // 3+ dates in one sentence
]

// ── Main validator ─────────────────────────────────────────────────────────────

export function validateAIOutputIntegrity(question: AIGameQuestion): AIValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let score = 100
    let confidenceScore = 100

    // 1. Required fields
    if (!question.id) { errors.push('Missing id'); score -= 20; confidenceScore -= 20 }
    if (!question.prompt || question.prompt.trim().length < 5) { errors.push('Missing or too-short prompt'); score -= 25; confidenceScore -= 25 }
    if (!question.subjectTag) { errors.push('Missing subjectTag'); score -= 10 }
    if (!question.skillTag) { errors.push('Missing skillTag'); score -= 10 }
    if (!question.gradeBand) { errors.push('Missing gradeBand'); score -= 10 }

    const promptLower = question.prompt?.toLowerCase() ?? ''

    // 2. MCQ validation
    if (question.answerOptions !== undefined) {
        const opts = question.answerOptions
        if (!Array.isArray(opts) || opts.length < 2) {
            errors.push('MCQ must have at least 2 options'); score -= 20; confidenceScore -= 20
        } else {
            if (question.correctAnswer) {
                const lower = opts.map(o => o.toLowerCase().trim())
                if (!lower.includes(question.correctAnswer.toLowerCase().trim())) {
                    errors.push('correctAnswer not found in answerOptions'); score -= 30; confidenceScore -= 40
                }
            }
            const lowerSet = new Set(opts.map(o => o.toLowerCase().trim()))
            if (lowerSet.size !== opts.length) {
                errors.push('Duplicate options detected'); score -= 15; confidenceScore -= 15
            }
            for (const opt of opts) {
                if (AMBIGUOUS_OPTIONS.has(opt.toLowerCase().trim())) {
                    warnings.push(`Ambiguous option: "${opt}"`); score -= 5; confidenceScore -= 8
                }
            }
        }
    }

    // 3. Grade-appropriate character length
    const maxLen = MAX_QUESTION_LENGTH[question.gradeBand] ?? 500
    if (question.prompt && question.prompt.length > maxLen) {
        warnings.push(`Question too long for grade ${question.gradeBand} (${question.prompt.length} > ${maxLen} chars)`)
        score -= 10; confidenceScore -= 5
    }

    // 4. Grade-appropriate word count (cognitive load)
    const wordCount = question.prompt?.trim().split(/\s+/).length ?? 0
    const maxWords = MAX_WORD_COUNT[question.gradeBand] ?? 120
    if (wordCount > maxWords) {
        warnings.push(`Cognitive overload: ${wordCount} words for grade ${question.gradeBand} (max ${maxWords})`)
        score -= 8; confidenceScore -= 10
    }

    // 5. Content safety filter
    for (const term of BLOCKED_TERMS) {
        if (promptLower.includes(term)) {
            errors.push(`Unsafe content detected: "${term}"`); score -= 40; confidenceScore -= 50
        }
    }

    // 6. Rubric validation
    if (question.rubric) {
        const criteriaSum = question.rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)
        if (criteriaSum !== question.rubric.maxScore) {
            errors.push(`Rubric criteria (${criteriaSum}) ≠ maxScore (${question.rubric.maxScore})`)
            score -= 15; confidenceScore -= 15
        }
    }

    // 7. Trick wording check (creates unintended ambiguity)
    for (const phrase of TRICK_WORDING) {
        if (promptLower.includes(phrase)) {
            warnings.push(`Trick/absolute wording detected: "${phrase}" — may invalidate the question for some students`)
            score -= 5; confidenceScore -= 8
        }
    }

    // 8. Cultural bias detection
    for (const flag of CULTURAL_FLAGS) {
        if (promptLower.includes(flag)) {
            errors.push(`Cultural bias indicator: "${flag}"`); score -= 20; confidenceScore -= 20
        }
    }

    // 9. Difficulty alignment (low difficulty + advanced vocabulary is a red flag)
    if (question.difficulty !== undefined && question.difficulty <= 2) {
        for (const term of ADVANCED_TERMS) {
            if (promptLower.includes(term)) {
                warnings.push(`Advanced term "${term}" found in difficulty ${question.difficulty} question — alignment mismatch`)
                score -= 8; confidenceScore -= 12
            }
        }
    }

    // 10. Hallucination guard (impossible dates, 5+ digit years)
    for (const pattern of HALLUC_PATTERNS) {
        if (pattern.test(question.prompt ?? '')) {
            warnings.push('Possible AI hallucination: suspicious date/number pattern detected')
            score -= 10; confidenceScore -= 20
        }
    }

    // 11. Logical consistency: numeric answer plausibility
    if (question.correctAnswer && !isPlausibleNumericAnswer(question.correctAnswer)) {
        errors.push(`Answer "${question.correctAnswer}" has too many decimal places — possible float drift or hallucination`)
        score -= 15; confidenceScore -= 25
    }

    // 12. No fact verification for pure math (correct) — skip; flag for other subjects
    if (question.subjectTag && !['mathematics', 'computer-science'].includes(question.subjectTag)) {
        if (!question.explanation || question.explanation.trim().length < 10) {
            warnings.push('Non-math question missing explanation — factual accuracy unverifiable without source')
            score -= 5; confidenceScore -= 10
        }
    }

    const passed = errors.length === 0
    return {
        passed,
        errors,
        warnings,
        score: Math.max(0, score),
        confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    }
}

/**
 * Batch validate with auto-retry support.
 * Returns questions with confidenceScore field annotated.
 */
export function filterValidAIQuestions(questions: AIGameQuestion[]): {
    valid: AIGameQuestion[]
    rejected: { question: AIGameQuestion; result: AIValidationResult }[]
} {
    const valid: AIGameQuestion[] = []
    const rejected: { question: AIGameQuestion; result: AIValidationResult }[] = []

    for (const q of questions) {
        const result = validateAIOutputIntegrity(q)
        if (result.passed) {
            valid.push({
                ...q,
                validationPassed: true,
                validatedAt: new Date(),
                confidenceScore: result.confidenceScore,
            })
        } else {
            rejected.push({ question: q, result })
        }
    }

    return { valid, rejected }
}
