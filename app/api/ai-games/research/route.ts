import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
            'X-Title': 'EduPlay Research Lab',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            max_tokens: 600,
            temperature: 0.7,
            // NOTE: No json_object here — Socratic responses are natural language, not JSON
        }),
    })

    if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown error')
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`)
    }

    const json = await res.json()
    return (json.choices?.[0]?.message?.content ?? '').trim()
}

const SOCRATIC_SYSTEM = `You are a Socratic educator. Your role is to guide students to discover knowledge through thoughtful questions, never by directly giving answers.
Rules:
- Always respond with a question or a thought-provoking prompt
- Acknowledge what the student said before asking the next question
- Keep responses concise (2-4 sentences max)
- Be warm, encouraging, and intellectually stimulating
- Never lecture — only guide`

// Fallbacks for when AI is unavailable
const FALLBACK_OPENERS: Record<string, string> = {
    default: "What do you already know about this topic? Start with the first thing that comes to mind.",
    math: "What patterns do you notice when you think about mathematics?",
    science: "If you were a scientist, what question would you want to investigate about this topic?",
    history: "What do you think caused the events surrounding this topic?",
}

function getSocraticFallback(topic: string, isOpener: boolean): string {
    if (isOpener) {
        const key = Object.keys(FALLBACK_OPENERS).find(k => topic.toLowerCase().includes(k)) ?? 'default'
        return `Let's explore: "${topic}". ${FALLBACK_OPENERS[key]}`
    }
    return "That's a thoughtful perspective! What evidence would you need to see to be more confident in that idea?"
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { topic = 'general knowledge', action, message, history } = body

    if (action === 'start') {
        try {
            const raw = await callOpenRouter([
                { role: 'system', content: SOCRATIC_SYSTEM },
                { role: 'user', content: `The student wants to explore: "${topic}". Start the Socratic session with one opening question.` },
            ])
            return NextResponse.json({ message: raw || getSocraticFallback(topic, true) })
        } catch (err) {
            console.warn('[research/start] AI unavailable:', err)
            return NextResponse.json({ message: getSocraticFallback(topic, true) })
        }
    }

    if (action === 'message') {
        if (!message?.trim()) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 })
        }
        const messages: { role: string; content: string }[] = [
            { role: 'system', content: `${SOCRATIC_SYSTEM}\n\nTopic being explored: "${topic}"` },
            ...(Array.isArray(history) ? history : []).map((h: { role: string; text: string }) => ({
                role: h.role === 'ai' ? 'assistant' : 'user',
                content: String(h.text ?? ''),
            })),
            { role: 'user', content: message },
        ]
        try {
            const raw = await callOpenRouter(messages)
            return NextResponse.json({ message: raw || getSocraticFallback(topic, false) })
        } catch (err) {
            console.warn('[research/message] AI unavailable:', err)
            return NextResponse.json({ message: getSocraticFallback(topic, false) })
        }
    }

    return NextResponse.json({ error: 'Invalid action — use "start" or "message"' }, { status: 400 })
}
