/**
 * lib/game-engine/cognitive-classifier.ts
 *
 * PHASE 6 — Cognitive Load & Bloom's Taxonomy Classifier
 *
 * Automatically assigns:
 *  - Bloom's taxonomy level (remember → create)
 *  - Estimated time-to-solve (seconds)
 *  - Cognitive load rating (low / medium / high)
 */

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
export type CognitiveLoad = 'low' | 'medium' | 'high'

export interface CognitiveProfile {
    bloomsLevel: BloomsLevel
    bloomsScore: number      // 1–6 integer
    cognitiveLoad: CognitiveLoad
    estimatedSeconds: number
    readingLevel: number     // Flesch-Kincaid grade
    wordCount: number
}

// ── Bloom's taxonomy verb signals ────────────────────────────────────────────

const BLOOMS_SIGNALS: Array<{ level: BloomsLevel; score: number; verbs: string[] }> = [
    {
        level: 'remember', score: 1,
        verbs: ['what is', 'define', 'identify', 'recall', 'list', 'name', 'state', 'who invented', 'when was', 'which is'],
    },
    {
        level: 'understand', score: 2,
        verbs: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'paraphrase', 'why does', 'what does it mean'],
    },
    {
        level: 'apply', score: 3,
        verbs: ['calculate', 'solve', 'compute', 'find', 'use', 'determine', 'apply', 'convert', 'simplify', 'evaluate the expression'],
    },
    {
        level: 'analyze', score: 4,
        verbs: ['analyze', 'differentiate', 'examine', 'break down', 'infer', 'distinguish', 'deduce', 'what is the relationship', 'why might'],
    },
    {
        level: 'evaluate', score: 5,
        verbs: ['justify', 'assess', 'critique', 'judge', 'defend', 'evaluate', 'argue', 'is it valid', 'which strategy is best', 'which approach'],
    },
    {
        level: 'create', score: 6,
        verbs: ['design', 'construct', 'formulate', 'develop', 'propose', 'create', 'write a program', 'write an equation', 'generate'],
    },
]

// ── Cognitive load signals ────────────────────────────────────────────────────

const HIGH_LOAD_SIGNALS = ['given that', 'assuming', 'if and only if', 'such that', 'prove that', 'derive', 'integral', 'differential']
const MEDIUM_LOAD_SIGNALS = ['calculate', 'solve for', 'convert', 'simplify', 'compare', 'explain why']

// ── Flesch-Kincaid grade estimate ────────────────────────────────────────────

function fkGrade(text: string): number {
    const sentences = Math.max(1, text.split(/[.!?]+/).filter(s => s.trim()).length)
    const words = text.trim().split(/\s+/).length
    const syllables = text.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/)
        .reduce((s, w) => s + Math.max(1, w.replace(/[^aeiouy]/g, '').length), 0)
    return Math.max(0, Math.round(0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59))
}

// ── Estimate time-to-solve ────────────────────────────────────────────────────

function estimateSeconds(bloomsScore: number, wordCount: number, cogLoad: CognitiveLoad): number {
    const baseByBlooms = [5, 8, 15, 25, 40, 60][bloomsScore - 1] ?? 15
    const readingTime = Math.ceil(wordCount / 3)  // 3 words/sec reading
    const loadMultiplier = { low: 1.0, medium: 1.4, high: 2.0 }[cogLoad]
    return Math.round((baseByBlooms + readingTime) * loadMultiplier)
}

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyCognitive(prompt: string): CognitiveProfile {
    const lowerPrompt = prompt.toLowerCase()
    const wordCount = prompt.trim().split(/\s+/).length
    const readingLevel = fkGrade(prompt)

    // Bloom's classification: find highest-scoring match
    let bloomsMatch = BLOOMS_SIGNALS[0]  // default: remember
    for (const signal of BLOOMS_SIGNALS) {
        if (signal.verbs.some(v => lowerPrompt.includes(v))) {
            if (signal.score > bloomsMatch.score) bloomsMatch = signal
        }
    }

    // Cognitive load
    let cognitiveLoad: CognitiveLoad = 'low'
    if (HIGH_LOAD_SIGNALS.some(s => lowerPrompt.includes(s))) {
        cognitiveLoad = 'high'
    } else if (MEDIUM_LOAD_SIGNALS.some(s => lowerPrompt.includes(s)) || wordCount > 40) {
        cognitiveLoad = 'medium'
    }

    const estimatedSeconds = estimateSeconds(bloomsMatch.score, wordCount, cognitiveLoad)

    return {
        bloomsLevel: bloomsMatch.level,
        bloomsScore: bloomsMatch.score,
        cognitiveLoad,
        estimatedSeconds,
        readingLevel,
        wordCount,
    }
}

/**
 * Batch classify and return sorted by Bloom's level (lowest first = drill order).
 */
export function classifyAndSort(prompts: string[]): (CognitiveProfile & { prompt: string })[] {
    return prompts
        .map(prompt => ({ prompt, ...classifyCognitive(prompt) }))
        .sort((a, b) => a.bloomsScore - b.bloomsScore)
}

/**
 * Check if a question's grade band is consistent with its cognitive profile.
 * Returns null if OK, or an error string if mismatched.
 */
export function checkGradeCognitiveAlignment(
    profile: CognitiveProfile,
    gradeBand: string
): string | null {
    const maxBlooms: Record<string, number> = { kg2: 2, '35': 3, '68': 5, '912': 6 }
    const max = maxBlooms[gradeBand] ?? 6
    if (profile.bloomsScore > max) {
        return `Bloom's level "${profile.bloomsLevel}" (score ${profile.bloomsScore}) exceeds maximum for grade band "${gradeBand}" (max ${max})`
    }
    return null
}
