import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { attemptJSONRepair } from '@/lib/ai-games/ai-fallback-handler'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set')
    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
            'X-Title': 'EduPlay AI Games',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            max_tokens: 1024,
            temperature: 0.5,
            response_format: { type: 'json_object' }, // ← forces clean JSON output
        }),
    })

    if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown error')
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`)
    }

    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? ''
}

// Fallback essay result when AI evaluation fails
const FALLBACK_ESSAY_RESULT = {
    totalScore: 12,
    maxScore: 20,
    grade: 'C',
    feedback: 'Your essay shows understanding of the topic. Focus on developing your arguments with more specific evidence and examples.',
    criteriaScores: [
        { criterion: 'Content', score: 5, feedback: 'Good ideas — support them with specific facts.' },
        { criterion: 'Organization', score: 4, feedback: 'Clear structure. Strengthen transitions between paragraphs.' },
        { criterion: 'Language', score: 3, feedback: 'Good vocabulary. Review grammar and sentence variety.' },
    ],
    suggestions: [
        'Add at least 2 specific examples or facts to support your main argument.',
        'Write a stronger conclusion that restates your thesis.',
        'Vary sentence length for better readability.',
    ],
    _fallback: true,
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { prompt, essay, rubric, gradeBand = '68' } = body
    if (!prompt || !essay) {
        return NextResponse.json({ error: 'prompt and essay are required' }, { status: 400 })
    }

    const rubricText = rubric?.criteria
        ? rubric.criteria.map((c: { name: string; maxPoints: number }) => `- ${c.name}: ${c.maxPoints} points`).join('\n')
        : '- Content: 8 points\n- Organization: 6 points\n- Language: 6 points'

    const systemPrompt = `You are an expert educational essay evaluator for grade band "${gradeBand}".
Evaluate the student essay strictly against the rubric below and return ONLY a valid JSON object:
{
  "totalScore": <number 0-20>,
  "maxScore": 20,
  "grade": "A" | "B" | "C" | "D" | "F",
  "feedback": "2-3 sentence overall feedback",
  "criteriaScores": [
    { "criterion": "Content", "score": <number>, "feedback": "specific feedback" },
    { "criterion": "Organization", "score": <number>, "feedback": "specific feedback" },
    { "criterion": "Language", "score": <number>, "feedback": "specific feedback" }
  ],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
Rubric:\n${rubricText}
Be encouraging but honest. Return ONLY the JSON object, no markdown, no preamble.`

    try {
        const raw = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Essay prompt: "${prompt}"\n\nStudent essay:\n${essay}` },
        ])

        // Attempt JSON repair — handles markdown fences and preamble text
        const parsed = attemptJSONRepair(raw) as Record<string, unknown> | null
        if (!parsed || typeof parsed !== 'object') {
            console.warn('[evaluate-essay] JSON repair failed — using fallback result')
            return NextResponse.json({ result: FALLBACK_ESSAY_RESULT })
        }

        // Clamp all numeric scores to valid ranges
        const clamp = (v: unknown, max = 100) => Math.round(Math.max(0, Math.min(max, isFinite(Number(v)) ? Number(v) : 0)))
        const result = {
            totalScore: clamp(parsed.totalScore, 20),
            maxScore: 20,
            grade: ['A', 'B', 'C', 'D', 'F'].includes(String(parsed.grade)) ? String(parsed.grade) : 'C',
            feedback: String(parsed.feedback ?? FALLBACK_ESSAY_RESULT.feedback),
            criteriaScores: Array.isArray(parsed.criteriaScores)
                ? parsed.criteriaScores.map((c: Record<string, unknown>) => ({
                    criterion: String(c.criterion ?? ''),
                    score: clamp(c.score, 20),
                    feedback: String(c.feedback ?? ''),
                }))
                : FALLBACK_ESSAY_RESULT.criteriaScores,
            suggestions: Array.isArray(parsed.suggestions)
                ? parsed.suggestions.map(String)
                : FALLBACK_ESSAY_RESULT.suggestions,
        }

        return NextResponse.json({ result })
    } catch (err) {
        console.error('[evaluate-essay] Error:', err)
        // Return fallback result — never 503 to the user
        return NextResponse.json({ result: FALLBACK_ESSAY_RESULT })
    }
}
