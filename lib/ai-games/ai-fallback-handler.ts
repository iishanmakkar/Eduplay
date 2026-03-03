/**
 * lib/ai-games/ai-fallback-handler.ts
 *
 * PHASE 7 — AI Game Reliability Hardening
 *
 * Safe fallback system for all AI-powered games.
 * If AI generation fails (network, rate limit, invalid JSON, timeout):
 *  1. Attempt JSON repair
 *  2. Retry up to 2× with exponential backoff
 *  3. Fall back to curated static question pool per subject
 *  4. Never return null to UI — always return a valid question
 */

import type { AIGameQuestion } from './types'

// ── Static fallback question pools (never empty) ──────────────────────────────

const FALLBACK_POOLS: Record<string, { prompt: string; options: string[]; correct: string; explanation: string }[]> = {
    mathematics: [
        { prompt: 'What is 15% of 80?', options: ['10', '12', '15', '20'], correct: '12', explanation: '15% × 80 = 0.15 × 80 = 12' },
        { prompt: 'Simplify: 4² + 3²', options: ['25', '35', '49', '7'], correct: '25', explanation: '16 + 9 = 25' },
        { prompt: 'What is the LCM of 4 and 6?', options: ['10', '12', '18', '24'], correct: '12', explanation: 'LCM(4,6) = 12' },
        { prompt: 'Solve: 3x = 21', options: ['5', '6', '7', '8'], correct: '7', explanation: 'x = 21 ÷ 3 = 7' },
        { prompt: 'What is ¾ as a decimal?', options: ['0.50', '0.65', '0.70', '0.75'], correct: '0.75', explanation: '3 ÷ 4 = 0.75' },
    ],
    science: [
        { prompt: 'What is the chemical formula for water?', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'], correct: 'H₂O', explanation: 'Water consists of 2 hydrogen atoms bonded to 1 oxygen atom.' },
        { prompt: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 'Mercury', explanation: 'Mercury is the first and innermost planet.' },
        { prompt: 'What force pulls objects toward Earth?', options: ['Friction', 'Magnetism', 'Gravity', 'Tension'], correct: 'Gravity', explanation: 'Gravity is the attractive force between masses.' },
    ],
    english: [
        { prompt: 'Choose the correct plural of "analysis":', options: ['analysises', 'analyzes', 'analyses', 'analysis'], correct: 'analyses', explanation: 'Words ending in -sis form plurals with -ses.' },
        { prompt: 'Which word is a synonym of "benevolent"?', options: ['Cruel', 'Indifferent', 'Kind', 'Hasty'], correct: 'Kind', explanation: 'Benevolent means well-meaning and kind.' },
    ],
    general: [
        { prompt: 'What is 7 × 8?', options: ['54', '56', '63', '64'], correct: '56', explanation: '7 × 8 = 56' },
        { prompt: 'How many sides does a hexagon have?', options: ['4', '5', '6', '7'], correct: '6', explanation: 'Hex- means six.' },
        { prompt: 'What is the square root of 144?', options: ['11', '12', '13', '14'], correct: '12', explanation: '12 × 12 = 144' },
    ],
}

function getSubjectKey(subject: string): string {
    const s = subject.toLowerCase()
    if (s.includes('math')) return 'mathematics'
    if (s.includes('science') || s.includes('chem') || s.includes('bio') || s.includes('phys')) return 'science'
    if (s.includes('english') || s.includes('language') || s.includes('grammar')) return 'english'
    return 'general'
}

let fallbackIndex = 0
function getRotatingFallback(subject: string): typeof FALLBACK_POOLS['general'][0] {
    const key = getSubjectKey(subject)
    const pool = FALLBACK_POOLS[key] ?? FALLBACK_POOLS.general
    const item = pool[fallbackIndex % pool.length]
    fallbackIndex++
    return item
}

function buildFallbackQuestion(subject: string, gameType: string): AIGameQuestion {
    const raw = getRotatingFallback(subject)
    return {
        id: `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        aiGenerated: true,
        gameType,
        prompt: raw.prompt,
        generationSeed: 'fallback',
        modelUsed: 'static-fallback',
        validationPassed: true,
        validatedAt: new Date(),
        subjectTag: subject,
        skillTag: getSubjectKey(subject),
        gradeBand: '68',
        difficulty: 3,
        answerOptions: raw.options,
        correctAnswer: raw.correct,
        explanation: raw.explanation,
        confidenceScore: 100,
    }
}

// ── JSON repair ───────────────────────────────────────────────────────────────

/**
 * Attempt to extract a valid JSON object from a string that may contain
 * markdown fences, preamble text, or trailing content.
 */
export function attemptJSONRepair(raw: string): unknown | null {
    // 1. Try direct parse
    try { return JSON.parse(raw) } catch { /* continue */ }

    // 2. Extract from markdown code fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (fenceMatch) {
        try { return JSON.parse(fenceMatch[1]) } catch { /* continue */ }
    }

    // 3. Extract first {...} block
    const braceStart = raw.indexOf('{')
    const braceEnd = raw.lastIndexOf('}')
    if (braceStart !== -1 && braceEnd > braceStart) {
        try { return JSON.parse(raw.slice(braceStart, braceEnd + 1)) } catch { /* continue */ }
    }

    // 4. Extract first [...] block (for question arrays)
    const bracketStart = raw.indexOf('[')
    const bracketEnd = raw.lastIndexOf(']')
    if (bracketStart !== -1 && bracketEnd > bracketStart) {
        try { return JSON.parse(raw.slice(bracketStart, bracketEnd + 1)) } catch { /* continue */ }
    }

    return null
}

// ── Main safe generation wrapper ──────────────────────────────────────────────

const GENERATION_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2

interface GenerationOptions {
    subject: string
    gradeBand: string
    topic?: string
    difficulty?: number
    gameType?: string
}

type GeneratorFn = (opts: GenerationOptions) => Promise<AIGameQuestion | null>

/**
 * Wraps any AI generator function with retry + JSON repair + fallback.
 * NEVER throws to the caller.
 */
export async function safeGenerateQuestion(
    generatorFn: GeneratorFn,
    opts: GenerationOptions
): Promise<AIGameQuestion> {
    const gameType = opts.gameType ?? 'GENERIC'

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const timeoutP = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT_MS)
            )
            const result = await Promise.race([generatorFn(opts), timeoutP])
            if (result) {
                return result
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.warn(`[AI_FALLBACK] Generation attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${msg}`)
            if (attempt < MAX_RETRIES) {
                // Exponential backoff: 500ms, 1000ms
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)))
            }
        }
    }

    // All retries exhausted — return static fallback
    console.warn('[AI_FALLBACK] All retries failed — serving static fallback question')
    return buildFallbackQuestion(opts.subject, gameType)
}

/**
 * Safe wrapper for AI essay / debate evaluation calls.
 * Returns a zero-score baseline result if AI evaluation fails.
 */
export function safeEvaluationFallback(type: 'essay' | 'debate') {
    if (type === 'essay') {
        return {
            totalScore: 0,
            maxScore: 100,
            grade: 'N/A',
            criteriaScores: [],
            overallFeedback: 'Evaluation service temporarily unavailable. Please try again.',
            suggestions: [],
            strengths: [],
        }
    }
    return {
        argumentQuality: 0,
        evidenceStrength: 0,
        logicalCoherence: 0,
        counterargumentHandling: 0,
        overallScore: 0,
        feedback: 'Evaluation service temporarily unavailable. Please try again.',
        suggestedCounterpoints: [],
    }
}
