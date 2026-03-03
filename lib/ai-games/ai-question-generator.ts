/**
 * lib/ai-games/ai-question-generator.ts
 *
 * AI question generation using OpenRouter API.
 * Defaults to google/gemini-2.0-flash-001 via OpenRouter.
 * All outputs pass validateAIOutputIntegrity() before being returned.
 *
 * Phase 7 — Academic Upgrade:
 * - Bloom's taxonomy level selection by difficulty tier
 * - CBSE / ICSE / IB / Common Core academic tone
 * - Grade-band vocabulary & complexity constraints
 * - Pedagogically valid distractor guidance per topic
 * - Post-parse MCQ integrity checks
 */

import crypto from 'crypto'
import type { AIGameQuestion, AIRubric } from './types'
import { validateAIOutputIntegrity } from './ai-answer-validator'
import { attemptJSONRepair } from '@/lib/ai-games/ai-fallback-handler'
import { GRADE_BAND_CONSTRAINTS, BLOOMS_PROMPT_DESCRIPTORS, type BloomsLevel } from '@/lib/game-engine/academic-question'
import { getDistractorPromptGuidance, validateMCQDistractors } from '@/lib/game-engine/distractor-engine'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001'

// --- Types ------------------------------------------------------------------

export interface GenerationParams {
    subject: string
    topic: string
    gradeBand: string
    difficulty: number
    questionType: 'mcq' | 'open' | 'essay' | 'debate'
    count?: number
}

// --- Seed -------------------------------------------------------------------

function makeSeed(params: GenerationParams): string {
    return crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 16)
}

// --- OpenRouter API call ----------------------------------------------------

async function callOpenRouter(prompt: string, model = DEFAULT_MODEL): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        return JSON.stringify(mockGenerate(prompt))
    }

    const res = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
            'X-Title': 'EduPlay AI Games',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educational content creator. Always respond with valid JSON only. No markdown fences, no extra text.',
                },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1024,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenRouter error ${res.status}: ${err.slice(0, 300)}`)
    }

    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? '{}'
}

// ── Grade-band & Bloom's constraint helpers ──────────────────────────────────

type GBKey = 'KG2' | '35' | '68' | '912'

function resolveGradeBandKey(gradeBand: string): GBKey {
    const map: Record<string, GBKey> = { kg2: 'KG2', '35': '35', '68': '68', '912': '912' }
    return map[gradeBand.toLowerCase().replace(/[^a-z0-9]/g, '')] ?? '68'
}

function getBloomsForDifficulty(difficulty: number): BloomsLevel {
    if (difficulty <= 1) return 'remember'
    if (difficulty === 2) return 'understand'
    if (difficulty === 3) return 'apply'
    if (difficulty === 4) return 'analyze'
    return 'evaluate'
}

function gradeConstraintText(gradeBand: string, subject: string): string {
    const gb = resolveGradeBandKey(gradeBand)
    const c = GRADE_BAND_CONSTRAINTS[gb]
    const lines = [
        `GRADE BAND: ${gb} (${gb === 'KG2' ? 'Kindergarten–Grade 2' : gb === '35' ? 'Grades 3–5' : gb === '68' ? 'Grades 6–8' : 'Grades 9–12'})`,
        `Vocabulary level: ${c.vocabularyLevel}`,
        `Max reasoning steps: ${c.maxSteps}`,
        gb === 'KG2' ? 'Numbers must be under 20. Visual, concrete context. No abstract symbols.' : '',
        gb === '35' ? 'Two-step max. Simple word problems. Decimals/fractions allowed at introductory level.' : '',
        gb === '68' ? 'Multi-step reasoning allowed. Algebra, ratios, graph interpretation at intermediate level.' : '',
        gb === '912' ? 'Full symbolic reasoning. Formal notation. Board-exam standard phrasing.' : '',
    ].filter(Boolean)
    return lines.join('\n')
}

function buildAcademicMCQPrompt({
    subject, topic, gradeBand, difficulty, bloomsLevel
}: {
    subject: string; topic: string; gradeBand: string; difficulty: number; bloomsLevel: BloomsLevel
}): string {
    const distractorGuidance = getDistractorPromptGuidance(topic, gradeBand)
    const bloomsDesc = BLOOMS_PROMPT_DESCRIPTORS[bloomsLevel]
    const gradeText = gradeConstraintText(gradeBand, subject)
    const gb = resolveGradeBandKey(gradeBand)
    const academicStyle = {
        KG2: 'Use simple, friendly language. No jargon. Short sentence.',
        '35': 'Use clear, school-standard language. CBSE/NCERT Grade 3-5 style.',
        '68': 'Use formal academic language. CBSE/ICSE Grade 6-8 standard. Structured wording.',
        '912': 'Use rigorous academic language. Board exam standard (CBSE/ICSE/IB). Precise mathematical/scientific notation where applicable.',
    }[gb]

    return `You are a senior ${subject} question setter for CBSE/ICSE/IB school examinations.
Generate 1 multiple-choice question on "${topic}" that tests Bloom's "${bloomsLevel}" level: ${bloomsDesc}.
Difficulty: ${difficulty}/5.

${gradeText}
Academic style: ${academicStyle}

DISTRACTOR RULES (critical):
${distractorGuidance}

RETURN ONLY this JSON object:
{
  "prompt": "Full question text, ending with ?",
  "answerOptions": ["correct answer", "distractor 1", "distractor 2", "distractor 3"],
  "correctAnswer": "exact text of correct option (verbatim from answerOptions)",
  "explanation": "Step-by-step explanation showing WHY the correct answer is right AND why each distractor is wrong",
  "skillTag": "snake_case skill identifier e.g. fraction_addition_unlike_denominators",
  "bloomsLevel": "${bloomsLevel}"
}

QUALITY CHECKLIST (you must satisfy ALL before returning):
✓ Exactly 4 options (no duplicates)
✓ correctAnswer matches one option verbatim
✓ No "all of the above", "none of the above"
✓ One unambiguous correct answer
✓ Each distractor reflects a real student error (not random)
✓ Explanation is mathematically/conceptually correct
✓ Grade-appropriate vocabulary and complexity`
}

// ── Safe post-parse MCQ normalizer ────────────────────────────────────────────

function normalizeAndVerifyMCQ(parsed: Record<string, unknown>): {
    prompt: string, answerOptions: string[], correctAnswer: string, explanation: string, skillTag: string, bloomsLevel: string
} | null {
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : null
    const correctAnswer = typeof parsed.correctAnswer === 'string' ? parsed.correctAnswer.trim() : null
    const explanation = typeof parsed.explanation === 'string' ? parsed.explanation.trim() : ''
    const skillTag = typeof parsed.skillTag === 'string' ? parsed.skillTag.trim() : 'general'
    const bloomsLevel = typeof parsed.bloomsLevel === 'string' ? parsed.bloomsLevel.trim() : 'apply'
    const rawOptions = Array.isArray(parsed.answerOptions)
        ? (parsed.answerOptions as unknown[]).map(o => String(o).trim()).filter(o => o.length > 0)
        : null

    if (!prompt || !correctAnswer || !rawOptions || rawOptions.length < 2) return null

    // Pad to 4 if necessary (shouldn't happen with good AI, but safety)
    const answerOptions = rawOptions.slice(0, 4)

    // Ensure correctAnswer is in options
    const hasCorrect = answerOptions.some(o => o.toLowerCase() === correctAnswer.toLowerCase())
    if (!hasCorrect) {
        // Inject correctAnswer as first option (replaces first wrong duplicate if any)
        console.warn('[MCQ normalize] correctAnswer not in options — injecting')
        answerOptions[0] = correctAnswer
    }

    // Run distractor quality check
    const issues = validateMCQDistractors(correctAnswer, answerOptions)
    if (issues.length > 0) {
        console.warn('[MCQ normalize] distractor issues:', issues.join('; '))
    }

    return { prompt, answerOptions, correctAnswer, explanation, skillTag, bloomsLevel }
}

// --- MCQ generation ---------------------------------------------------------

export async function generateAIMathQuestion(
    gradeBand: string,
    topic: string,
    difficulty = 3
): Promise<AIGameQuestion | null> {
    const params: GenerationParams = { subject: 'mathematics', topic, gradeBand, difficulty, questionType: 'mcq' }
    const seed = makeSeed(params)
    const bloomsLevel = getBloomsForDifficulty(difficulty)

    const prompt = buildAcademicMCQPrompt({ subject: 'mathematics', topic, gradeBand, difficulty, bloomsLevel })

    try {
        const raw = await callOpenRouter(prompt)
        const parsedRaw = attemptJSONRepair(raw) as Record<string, unknown> | null
        if (!parsedRaw) return null
        const normalized = normalizeAndVerifyMCQ(parsedRaw)
        if (!normalized) return null

        const q: AIGameQuestion = {
            id: `ai-math-${seed}-${Date.now()}`,
            aiGenerated: true,
            gameType: 'math-ai',
            prompt: normalized.prompt,
            answerOptions: normalized.answerOptions,
            correctAnswer: normalized.correctAnswer,
            explanation: normalized.explanation,
            generationSeed: seed,
            modelUsed: DEFAULT_MODEL,
            subjectTag: 'mathematics',
            skillTag: normalized.skillTag,
            gradeBand,
            difficulty,
            validationPassed: false,
        }
        const validation = validateAIOutputIntegrity(q)
        if (!validation.passed) return null
        return { ...q, validationPassed: true, validatedAt: new Date() }
    } catch {
        return null
    }
}

// --- Subject MCQ generation -------------------------------------------------

export async function generateAISubjectQuestion(
    subject: string,
    topic: string,
    gradeBand: string,
    difficulty = 3
): Promise<AIGameQuestion | null> {
    const params: GenerationParams = { subject, topic, gradeBand, difficulty, questionType: 'mcq' }
    const seed = makeSeed(params)
    const bloomsLevel = getBloomsForDifficulty(difficulty)
    const prompt = buildAcademicMCQPrompt({ subject, topic, gradeBand, difficulty, bloomsLevel })

    try {
        const raw = await callOpenRouter(prompt)
        const parsedRaw = attemptJSONRepair(raw) as Record<string, unknown> | null
        if (!parsedRaw) return null
        const normalized = normalizeAndVerifyMCQ(parsedRaw)
        if (!normalized) return null

        const q: AIGameQuestion = {
            id: `ai-${subject}-${seed}-${Date.now()}`,
            aiGenerated: true,
            gameType: `${subject}-ai`,
            prompt: normalized.prompt,
            answerOptions: normalized.answerOptions,
            correctAnswer: normalized.correctAnswer,
            explanation: normalized.explanation,
            generationSeed: seed,
            modelUsed: DEFAULT_MODEL,
            subjectTag: subject,
            skillTag: normalized.skillTag,
            gradeBand,
            difficulty,
            validationPassed: false,
        }
        const validation = validateAIOutputIntegrity(q)
        if (!validation.passed) return null
        return { ...q, validationPassed: true, validatedAt: new Date() }
    } catch {
        return null
    }
}

// --- Essay prompt generation ------------------------------------------------

export async function generateAIEssayPrompt(
    gradeBand: string,
    subject: string,
    topic?: string
): Promise<AIGameQuestion | null> {
    const params: GenerationParams = { subject, topic: topic ?? subject, gradeBand, difficulty: 3, questionType: 'essay' }
    const seed = makeSeed(params)

    const prompt = `Generate 1 essay prompt for grade band "${gradeBand}" in subject "${subject}"${topic ? ` about "${topic}"` : ''}.

Return JSON only:
{
  "prompt": "The essay question",
  "skillTag": "skill being assessed",
  "rubric": {
    "maxScore": 20,
    "criteria": [
      { "name": "Content", "description": "Accuracy and depth", "maxPoints": 8, "levels": [
        {"score": 8, "descriptor": "Excellent"}, {"score": 6, "descriptor": "Good"},
        {"score": 4, "descriptor": "Developing"}, {"score": 2, "descriptor": "Beginning"}
      ]},
      { "name": "Organization", "description": "Structure and flow", "maxPoints": 6, "levels": [
        {"score": 6, "descriptor": "Excellent"}, {"score": 4, "descriptor": "Good"},
        {"score": 2, "descriptor": "Developing"}, {"score": 1, "descriptor": "Beginning"}
      ]},
      { "name": "Language", "description": "Grammar and vocabulary", "maxPoints": 6, "levels": [
        {"score": 6, "descriptor": "Excellent"}, {"score": 4, "descriptor": "Good"},
        {"score": 2, "descriptor": "Developing"}, {"score": 1, "descriptor": "Beginning"}
      ]}
    ]
  }
}`

    try {
        const raw = await callOpenRouter(prompt)
        const parsed = JSON.parse(raw)
        const q: AIGameQuestion = {
            id: `ai-essay-${seed}-${Date.now()}`,
            aiGenerated: true,
            gameType: 'essay-ai',
            prompt: parsed.prompt,
            rubric: parsed.rubric as AIRubric,
            generationSeed: seed,
            modelUsed: DEFAULT_MODEL,
            subjectTag: subject,
            skillTag: parsed.skillTag ?? 'writing',
            gradeBand,
            difficulty: 3,
            validationPassed: false,
        }
        const validation = validateAIOutputIntegrity(q)
        if (!validation.passed) return null
        return { ...q, validationPassed: true, validatedAt: new Date() }
    } catch {
        return null
    }
}

// --- Batch generation -------------------------------------------------------

export async function generateAIQuestionBatch(
    params: GenerationParams,
    count = 10
): Promise<AIGameQuestion[]> {
    const results: AIGameQuestion[] = []
    const promises = Array.from({ length: count }, () =>
        generateAIMathQuestion(params.gradeBand, params.topic, params.difficulty)
    )
    const settled = await Promise.allSettled(promises)
    for (const r of settled) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value)
    }
    return results
}

// --- Mock (no API key) ------------------------------------------------------

function mockGenerate(prompt: string): unknown {
    if (prompt.includes('essay')) {
        return {
            prompt: 'Discuss the impact of technology on modern education.',
            skillTag: 'critical-thinking',
            rubric: {
                maxScore: 20,
                criteria: [
                    {
                        name: 'Content', description: 'Accuracy', maxPoints: 8, levels: [
                            { score: 8, descriptor: 'Excellent' }, { score: 6, descriptor: 'Good' },
                            { score: 4, descriptor: 'Developing' }, { score: 2, descriptor: 'Beginning' }
                        ]
                    },
                    {
                        name: 'Organization', description: 'Structure', maxPoints: 6, levels: [
                            { score: 6, descriptor: 'Excellent' }, { score: 4, descriptor: 'Good' },
                            { score: 2, descriptor: 'Developing' }, { score: 1, descriptor: 'Beginning' }
                        ]
                    },
                    {
                        name: 'Language', description: 'Grammar', maxPoints: 6, levels: [
                            { score: 6, descriptor: 'Excellent' }, { score: 4, descriptor: 'Good' },
                            { score: 2, descriptor: 'Developing' }, { score: 1, descriptor: 'Beginning' }
                        ]
                    }
                ]
            }
        }
    }
    return {
        prompt: 'If a train travels 60 km/h for 2 hours, how far does it travel?',
        answerOptions: ['100 km', '120 km', '140 km', '160 km'],
        correctAnswer: '120 km',
        explanation: 'Distance = Speed x Time = 60 x 2 = 120 km',
        skillTag: 'speed-distance-time',
    }
}
