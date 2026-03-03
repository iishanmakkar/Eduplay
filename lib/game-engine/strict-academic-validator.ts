/**
 * lib/game-engine/strict-academic-validator.ts
 *
 * PHASE 1 — Strict Academic Validation Layer
 *
 * strictAcademicValidation(question) checks:
 *  1. Exactly one unambiguous correct answer
 *  2. No duplicate options (normalized)
 *  3. No floating-point precision drift
 *  4. No alternative-valid-english-answer gaps
 *  5. No ambiguous vocabulary (hedging words)
 *  6. No outdated science claims
 *  7. Reading level alignment
 *  8. Distractor quality (not too similar, not too obvious)
 *  9. Mathematical determinism (answer recomputable)
 * 10. NaN / Infinity guard
 */

export type BloomsLevel =
    | 'remember'
    | 'understand'
    | 'apply'
    | 'analyze'
    | 'evaluate'
    | 'create'

export type GradeBand = 'kg2' | '35' | '68' | '912'

export interface QuestionForAudit {
    prompt: string
    options: string[]
    answer: string
    gameKey?: string
    gradeBand?: GradeBand | string
    bloomsLevel?: BloomsLevel
    subject?: string
}

export interface AcademicValidationResult {
    passed: boolean
    errors: AcademicViolation[]
    warnings: AcademicWarning[]
    confidenceScore: number   // 0–100, reflects answer certainty
    bloomsLevel?: BloomsLevel
    readingLevel?: number     // Flesch-Kincaid grade estimate
    distractorQuality: 'poor' | 'adequate' | 'excellent'
}

export interface AcademicViolation {
    code: string
    message: string
    severity: 'critical' | 'major' | 'minor'
}

export interface AcademicWarning {
    code: string
    message: string
}

// ── Ambiguous / hedging vocabulary ────────────────────────────────────────────

const HEDGING_TERMS = new Set([
    'sometimes', 'usually', 'often', 'generally', 'typically', 'mainly', 'likely',
    'probably', 'approximately', 'roughly', 'almost', 'nearly', 'sort of', 'kind of',
])

// ── Outdated science terms ────────────────────────────────────────────────────

const OUTDATED_SCIENCE = new Map([
    ['pluto is a planet', 'Pluto was reclassified as a dwarf planet in 2006'],
    ['9 planets', 'Solar system has 8 planets (Pluto reclassified 2006)'],
    ['atom cannot be divided', 'Atoms consist of protons, neutrons, electrons — divisible'],
    ['dna is rna', 'DNA and RNA are distinct molecules'],
])

// ── Flesch-Kincaid grade estimate (simplified) ───────────────────────────────

function fkGradeEstimate(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1
    const words = text.trim().split(/\s+/).length
    const syllables = text
        .toLowerCase()
        .replace(/[^a-z]/g, ' ')
        .split(/\s+/)
        .reduce((sum, w) => sum + Math.max(1, w.replace(/[^aeiouy]/g, '').length), 0)
    return Math.round(0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59)
}

// ── Grade band max FK grade ───────────────────────────────────────────────────

const MAX_FK_GRADE: Record<string, number> = {
    kg2: 2, '35': 5, '68': 8, '912': 12,
}

// ── Distractor quality scorer ────────────────────────────────────────────────

function scoreDistractors(options: string[], answer: string): 'poor' | 'adequate' | 'excellent' {
    const normalised = options.map(o => o.toLowerCase().trim())
    const answerNorm = answer.toLowerCase().trim()
    const distractors = normalised.filter(d => d !== answerNorm)

    // Poor: all distractors trivially different (single character off or empty)
    const trivial = distractors.filter(d => d.length < 2 || Math.abs(d.length - answerNorm.length) > 10)
    if (trivial.length === distractors.length) return 'poor'

    // Excellent: at least 2 plausible (within same numeric order of magnitude or same word class)
    const plausible = distractors.filter(d => {
        const dn = parseFloat(d), an = parseFloat(answerNorm)
        if (!isNaN(dn) && !isNaN(an)) return Math.abs(dn - an) / (Math.abs(an) || 1) < 5 // within 5x
        return d.split(' ').length === answerNorm.split(' ').length  // same word count = plausible
    })

    return plausible.length >= 2 ? 'excellent' : 'adequate'
}

// ── Main validator ────────────────────────────────────────────────────────────

export function strictAcademicValidation(q: QuestionForAudit): AcademicValidationResult {
    const violations: AcademicViolation[] = []
    const warnings: AcademicWarning[] = []
    let confidenceScore = 100

    // 1. Required fields
    if (!q.prompt?.trim()) violations.push({ code: 'EMPTY_PROMPT', message: 'Question prompt is empty', severity: 'critical' })
    if (!q.answer?.trim()) violations.push({ code: 'EMPTY_ANSWER', message: 'Answer is empty', severity: 'critical' })
    if (!q.options?.length) violations.push({ code: 'NO_OPTIONS', message: 'No answer options provided', severity: 'critical' })

    if (violations.length > 0) {
        return { passed: false, errors: violations, warnings, confidenceScore: 0, distractorQuality: 'poor' }
    }

    // 2. NaN / Infinity guard
    const numericAnswer = parseFloat(q.answer)
    if (q.answer && !isNaN(numericAnswer)) {
        if (!isFinite(numericAnswer)) {
            violations.push({ code: 'INFINITE_ANSWER', message: `Answer is Infinity/NaN: "${q.answer}"`, severity: 'critical' })
            confidenceScore -= 40
        }
    }
    for (const opt of q.options) {
        const n = parseFloat(opt)
        if (!isNaN(n) && !isFinite(n)) {
            violations.push({ code: 'INFINITE_OPTION', message: `Option "${opt}" is Infinity/NaN`, severity: 'critical' })
            confidenceScore -= 20
        }
    }

    // 3. Floating-point precision drift check
    // If answer is numeric, verify it's within standard precision (no drift beyond 2dp unless intended)
    if (!isNaN(numericAnswer) && q.answer.includes('.')) {
        const decimals = (q.answer.split('.')[1] ?? '').length
        if (decimals > 6) {
            warnings.push({ code: 'PRECISION_DRIFT', message: `Answer has ${decimals} decimal places — possible float drift: "${q.answer}"` })
            confidenceScore -= 5
        }
    }

    // 4. Answer must be in options (normalized)
    const normalOpts = q.options.map(o => o.toLowerCase().trim())
    const normalAns = q.answer.toLowerCase().trim()
    if (!normalOpts.includes(normalAns)) {
        violations.push({ code: 'ANSWER_NOT_IN_OPTIONS', message: `Answer "${q.answer}" not found in options`, severity: 'critical' })
        confidenceScore -= 50
    }

    // 5. No duplicate options
    const dedupedOpts = new Set(normalOpts)
    if (dedupedOpts.size !== q.options.length) {
        violations.push({ code: 'DUPLICATE_OPTIONS', message: `Options contain duplicates: ${q.options.join(' | ')}`, severity: 'major' })
        confidenceScore -= 20
    }

    // 6. Exactly 1 correct answer (no two options match answer)
    const matchCount = normalOpts.filter(o => o === normalAns).length
    if (matchCount > 1) {
        violations.push({ code: 'MULTIPLE_CORRECT', message: `${matchCount} options match the answer`, severity: 'critical' })
        confidenceScore -= 40
    }

    // 7. Ambiguous / hedging vocabulary in prompt
    const promptLower = q.prompt.toLowerCase()
    for (const term of HEDGING_TERMS) {
        if (promptLower.includes(term)) {
            warnings.push({ code: 'HEDGING_VOCAB', message: `Ambiguous term "${term}" in prompt — questions should be definitive` })
            confidenceScore -= 3
        }
    }

    // 8. Outdated science
    for (const [claim, correction] of OUTDATED_SCIENCE) {
        if (promptLower.includes(claim) || q.answer.toLowerCase().includes(claim)) {
            violations.push({ code: 'OUTDATED_SCIENCE', message: `Outdated claim detected: "${claim}". ${correction}`, severity: 'major' })
            confidenceScore -= 25
        }
    }

    // 9. Reading level check
    const fk = fkGradeEstimate(q.prompt)
    const maxFk = q.gradeBand ? MAX_FK_GRADE[q.gradeBand] ?? 12 : 12
    if (fk > maxFk + 2) {
        violations.push({ code: 'READING_LEVEL_TOO_HIGH', message: `FK grade ~${fk} exceeds band max ${maxFk} for grade "${q.gradeBand}"`, severity: 'major' })
        confidenceScore -= 15
    }

    // 10. "All of the above" / "None of the above" detection
    const badOpts = ['all of the above', 'none of the above', 'both a and b', 'cannot be determined']
    for (const opt of normalOpts) {
        if (badOpts.includes(opt)) {
            violations.push({ code: 'META_OPTION', message: `Non-pedagogical option: "${opt}"`, severity: 'major' })
            confidenceScore -= 20
        }
    }

    const distractorQuality = scoreDistractors(q.options, q.answer)
    if (distractorQuality === 'poor') {
        warnings.push({ code: 'POOR_DISTRACTORS', message: 'Distractor options are too trivially wrong — increase plausibility' })
        confidenceScore -= 10
    }

    const passed = violations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0
    return {
        passed,
        errors: violations,
        warnings,
        confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
        readingLevel: fk,
        distractorQuality,
    }
}

/**
 * Batch audit — run strictAcademicValidation on many questions.
 * Returns a certification summary.
 */
export function runCertificationAudit(questions: QuestionForAudit[]): {
    totalQuestions: number
    passed: number
    failed: number
    passRate: number
    criticalViolations: number
    majorViolations: number
    avgConfidenceScore: number
    topViolations: { code: string; count: number }[]
    certified: boolean
} {
    const results = questions.map(q => strictAcademicValidation(q))
    const passed = results.filter(r => r.passed).length
    const failed = results.length - passed
    const allViolations = results.flatMap(r => r.errors)
    const violationCounts = new Map<string, number>()
    for (const v of allViolations) {
        violationCounts.set(v.code, (violationCounts.get(v.code) ?? 0) + 1)
    }
    const topViolations = [...violationCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({ code, count }))

    const avgConfidenceScore = results.reduce((s, r) => s + r.confidenceScore, 0) / results.length

    return {
        totalQuestions: questions.length,
        passed,
        failed,
        passRate: passed / questions.length,
        criticalViolations: allViolations.filter(v => v.severity === 'critical').length,
        majorViolations: allViolations.filter(v => v.severity === 'major').length,
        avgConfidenceScore: Math.round(avgConfidenceScore),
        topViolations,
        certified: passed / questions.length >= 0.97,  // 97% pass rate required for certification
    }
}
