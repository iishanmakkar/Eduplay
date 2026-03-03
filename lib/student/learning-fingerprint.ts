/**
 * lib/student/learning-fingerprint.ts
 *
 * PHASE 7 — Student Learning Fingerprint (Data Moat)
 *
 * Every student develops a unique response pattern signature:
 *  - θ per skill (IRT ability)
 *  - Error fingerprint (which distractors they select)
 *  - Time-to-solve distribution (speed profile)
 *  - Distractor bias (systematic wrong-answer patterns)
 *  - Confidence calibration (accuracy vs speed correlation)
 */

export interface DistractorPattern {
    optionText: string
    selectedCount: number
    correctAnswer: string
    skillTag: string
}

export interface TimeProfile {
    skillTag: string
    p10: number     // 10th percentile (fast)
    p50: number     // median
    p90: number     // 90th percentile (slow)
    mean: number
    stdDev: number
    speedCategory: 'impulsive' | 'fast' | 'deliberate' | 'slow'
}

export interface ErrorCluster {
    errorType: 'sign_error' | 'magnitude_error' | 'concept_confusion' | 'careless' | 'knowledge_gap'
    frequency: number
    exampleSkills: string[]
    description: string
}

export interface LearningFingerprint {
    userId: string
    generatedAt: Date

    // θ per skill
    skillAbilities: {
        skillTag: string
        theta: number
        se: number
        masteryStatus: string
    }[]

    // Error fingerprint
    errorClusters: ErrorCluster[]
    mostCommonDistractor: DistractorPattern | null

    // Speed profile
    timeProfiles: TimeProfile[]
    overallSpeedCategory: 'impulsive' | 'fast' | 'deliberate' | 'slow'

    // Distractor bias
    distractorBiasScore: number    // 0–1: 1 = always picks same wrong type
    systematicErrors: string[]

    // Confidence calibration
    calibrationScore: number       // 0–1: how well speed reflects accuracy
    overconfidenceScore: number    // 0–1: 1 = fast but wrong frequently

    // Learning style signature
    learningStyle: 'analytical' | 'intuitive' | 'methodical' | 'impulsive'
    strengthSubjects: string[]
    gapSubjects: string[]

    // Defensible moat metadata
    fingerprintVersion: string
    dataPoints: number
}

// ── Time profile builder ──────────────────────────────────────────────────────

function buildTimeProfile(times: number[], skillTag: string): TimeProfile {
    if (times.length === 0) return {
        skillTag, p10: 0, p50: 0, p90: 0, mean: 0, stdDev: 0, speedCategory: 'deliberate'
    }
    const sorted = [...times].sort((a, b) => a - b)
    const n = sorted.length
    const p10 = sorted[Math.floor(n * 0.1)] ?? sorted[0]
    const p50 = sorted[Math.floor(n * 0.5)] ?? sorted[0]
    const p90 = sorted[Math.floor(n * 0.9)] ?? sorted[n - 1]
    const mean = times.reduce((s, x) => s + x) / n
    const stdDev = Math.sqrt(times.reduce((s, x) => s + (x - mean) ** 2) / n)

    let speedCategory: TimeProfile['speedCategory']
    if (p50 < 5000) speedCategory = 'impulsive'
    else if (p50 < 12000) speedCategory = 'fast'
    else if (p50 < 25000) speedCategory = 'deliberate'
    else speedCategory = 'slow'

    return { skillTag, p10, p50, p90, mean: Math.round(mean), stdDev: Math.round(stdDev), speedCategory }
}

// ── Error cluster classifier ──────────────────────────────────────────────────

function classifyErrors(
    incorrectResponses: { userAnswer: string; correctAnswer: string; skillTag: string }[]
): ErrorCluster[] {
    const clusters: Map<ErrorCluster['errorType'], { count: number; skills: Set<string> }> = new Map()

    for (const r of incorrectResponses) {
        const correct = parseFloat(r.correctAnswer)
        const given = parseFloat(r.userAnswer)

        let errorType: ErrorCluster['errorType'] = 'knowledge_gap'

        if (!isNaN(correct) && !isNaN(given)) {
            if (Math.abs(given) === Math.abs(correct) && given !== correct) errorType = 'sign_error'
            else if (Math.abs(correct) > 0 && Math.abs((given - correct) / correct) < 0.5) errorType = 'magnitude_error'
            else errorType = 'concept_confusion'
        } else if (r.userAnswer.toLowerCase().includes(r.correctAnswer.toLowerCase().slice(0, 3))) {
            errorType = 'careless'
        }

        const existing = clusters.get(errorType) ?? { count: 0, skills: new Set() }
        existing.count++
        existing.skills.add(r.skillTag)
        clusters.set(errorType, existing)
    }

    const descriptions: Record<ErrorCluster['errorType'], string> = {
        sign_error: 'Correct magnitude but wrong sign — suggests integer/direction confusion',
        magnitude_error: 'Close but off by a factor — rounding or operation-order issue',
        concept_confusion: 'Systematically choosing plausible-but-wrong answers — conceptual gap',
        careless: 'Answers close to correct wording — likely misread or rushed',
        knowledge_gap: 'Random or unrelated answers — topic not yet learned',
    }

    return [...clusters.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([type, data]) => ({
            errorType: type,
            frequency: data.count,
            exampleSkills: [...data.skills].slice(0, 3),
            description: descriptions[type],
        }))
}

// ── Confidence calibration ────────────────────────────────────────────────────

function computeCalibration(
    responses: { correct: boolean; timeTakenMs: number }[]
): { calibration: number; overconfidence: number } {
    if (responses.length < 5) return { calibration: 0.5, overconfidence: 0 }

    // Fast responses (< 10s) — should be correct for calibrated students
    const fast = responses.filter(r => r.timeTakenMs < 10000)
    const fastAccuracy = fast.length > 0 ? fast.filter(r => r.correct).length / fast.length : 0.5

    // Slow responses (> 20s) — should also be correct for careful students
    const slow = responses.filter(r => r.timeTakenMs > 20000)
    const slowAccuracy = slow.length > 0 ? slow.filter(r => r.correct).length / slow.length : 0.5

    // Calibration: fast correct ≈ slow correct → well-calibrated
    const calibration = 1 - Math.abs(fastAccuracy - slowAccuracy)

    // Overconfidence: fast AND wrong
    const fastWrong = fast.filter(r => !r.correct).length
    const overconfidence = fast.length > 0 ? fastWrong / fast.length : 0

    return {
        calibration: Math.round(calibration * 100) / 100,
        overconfidence: Math.round(overconfidence * 100) / 100,
    }
}

// ── Main fingerprint builder ──────────────────────────────────────────────────

export interface RawStudentData {
    skillAbilities: { skillTag: string; theta: number; se: number; masteryStatus: string }[]
    responses: {
        userAnswer: string
        correctAnswer: string
        correct: boolean
        timeTakenMs: number
        skillTag: string
        subject: string
        selectedOption?: string
    }[]
}

export function buildLearningFingerprint(userId: string, data: RawStudentData): LearningFingerprint {
    const { skillAbilities, responses } = data

    // Time profiles by skill
    const timeBySkill = new Map<string, number[]>()
    for (const r of responses) {
        const arr = timeBySkill.get(r.skillTag) ?? []
        arr.push(r.timeTakenMs)
        timeBySkill.set(r.skillTag, arr)
    }
    const timeProfiles = [...timeBySkill.entries()].map(([skill, times]) => buildTimeProfile(times, skill))

    const allTimes = responses.map(r => r.timeTakenMs)
    const overallTimeProfile = buildTimeProfile(allTimes, 'overall')

    // Error clusters
    const incorrect = responses.filter(r => !r.correct)
    const errorClusters = classifyErrors(incorrect)

    // Most common wrong distractor
    const distractorCounts = new Map<string, number>()
    for (const r of incorrect) {
        if (r.selectedOption) {
            distractorCounts.set(r.selectedOption, (distractorCounts.get(r.selectedOption) ?? 0) + 1)
        }
    }
    const topDistractor = [...distractorCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const mostCommonDistractor = topDistractor ? {
        optionText: topDistractor[0],
        selectedCount: topDistractor[1],
        correctAnswer: incorrect.find(r => r.selectedOption === topDistractor[0])?.correctAnswer ?? '',
        skillTag: incorrect.find(r => r.selectedOption === topDistractor[0])?.skillTag ?? '',
    } : null

    // Calibration
    const { calibration, overconfidence } = computeCalibration(responses)

    // Distractor bias score (are errors concentrated in same options?)
    const totalErrors = incorrect.length
    const maxDistractorCount = topDistractor?.[1] ?? 0
    const distractorBiasScore = totalErrors > 0 ? Math.round(maxDistractorCount / totalErrors * 100) / 100 : 0

    // Learning style
    let learningStyle: LearningFingerprint['learningStyle']
    if (overallTimeProfile.speedCategory === 'impulsive' && overconfidence > 0.4) learningStyle = 'impulsive'
    else if (overallTimeProfile.speedCategory === 'fast' && calibration > 0.7) learningStyle = 'intuitive'
    else if (overallTimeProfile.speedCategory === 'deliberate' && calibration > 0.6) learningStyle = 'analytical'
    else learningStyle = 'methodical'

    // Strength and gap subjects
    const subjectAccuracy = new Map<string, { correct: number; total: number }>()
    for (const r of responses) {
        const s = subjectAccuracy.get(r.subject) ?? { correct: 0, total: 0 }
        s.total++; if (r.correct) s.correct++
        subjectAccuracy.set(r.subject, s)
    }
    const subjectRates = [...subjectAccuracy.entries()].map(([subj, { correct, total }]) => ({ subj, rate: correct / total }))
    const strengthSubjects = subjectRates.filter(s => s.rate >= 0.75).map(s => s.subj)
    const gapSubjects = subjectRates.filter(s => s.rate < 0.5).map(s => s.subj)

    const systematicErrors = errorClusters
        .filter(e => e.frequency >= 3)
        .map(e => `${e.errorType}: ${e.description}`)

    return {
        userId, generatedAt: new Date(),
        skillAbilities, errorClusters, mostCommonDistractor,
        timeProfiles, overallSpeedCategory: overallTimeProfile.speedCategory,
        distractorBiasScore, systematicErrors,
        calibrationScore: calibration, overconfidenceScore: overconfidence,
        learningStyle, strengthSubjects, gapSubjects,
        fingerprintVersion: '1.0',
        dataPoints: responses.length,
    }
}
