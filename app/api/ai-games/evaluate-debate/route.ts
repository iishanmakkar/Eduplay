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
            max_tokens: 512,
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

const clamp = (v: unknown, max = 100) =>
    Math.round(Math.max(0, Math.min(max, isFinite(Number(v)) ? Number(v) : 0)))

// Fallback debate result when AI evaluation fails
const FALLBACK_DEBATE_RESULT = {
    argumentQuality: 65,
    evidenceStrength: 60,
    logicalCoherence: 70,
    counterargumentHandling: 55,
    overallScore: 63,
    feedback: 'Good start! Your argument shows a clear position. Strengthen it by adding specific evidence — statistics, examples, or expert quotes — and proactively address the opposing view.',
    suggestedCounterpoints: [
        'Consider acknowledging the strongest opposing argument and then refuting it.',
        'Add at least one factual statistic or real-world example to make your case more persuasive.',
    ],
    _fallback: true,
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { topic, side, argument, round } = body
    if (!topic || !argument) {
        return NextResponse.json({ error: 'topic and argument are required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert debate coach evaluating a student's argument.
The student is arguing ${side === 'for' ? 'FOR' : 'AGAINST'} the motion: "${topic}"
This is round ${round ?? 1}.

Evaluate the argument and return ONLY a valid JSON object (no markdown, no preamble):
{
  "argumentQuality": <0-100>,
  "evidenceStrength": <0-100>,
  "logicalCoherence": <0-100>,
  "counterargumentHandling": <0-100>,
  "overallScore": <0-100>,
  "feedback": "2-3 sentence constructive feedback",
  "suggestedCounterpoints": ["counterpoint 1", "counterpoint 2"]
}

Be encouraging and educational. Focus on improving argumentation skills.`

    try {
        const raw = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Student's argument:\n${argument}` },
        ])

        // Attempt JSON repair — handles any markdown fences or preamble
        const parsed = attemptJSONRepair(raw) as Record<string, unknown> | null
        if (!parsed || typeof parsed !== 'object') {
            console.warn('[evaluate-debate] JSON repair failed — using fallback result')
            return NextResponse.json({ result: FALLBACK_DEBATE_RESULT })
        }

        const result = {
            argumentQuality: clamp(parsed.argumentQuality),
            evidenceStrength: clamp(parsed.evidenceStrength),
            logicalCoherence: clamp(parsed.logicalCoherence),
            counterargumentHandling: clamp(parsed.counterargumentHandling),
            overallScore: clamp(parsed.overallScore),
            feedback: String(parsed.feedback ?? FALLBACK_DEBATE_RESULT.feedback),
            suggestedCounterpoints: Array.isArray(parsed.suggestedCounterpoints)
                ? parsed.suggestedCounterpoints.map(String)
                : FALLBACK_DEBATE_RESULT.suggestedCounterpoints,
        }

        return NextResponse.json({ result })
    } catch (err) {
        console.error('[evaluate-debate] Error:', err)
        return NextResponse.json({ result: FALLBACK_DEBATE_RESULT })
    }
}
