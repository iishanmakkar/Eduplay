import { NextRequest, NextResponse } from 'next/server'
import {
    generateAIMathQuestion,
    generateAISubjectQuestion,
    generateAIEssayPrompt,
} from '@/lib/ai-games/ai-question-generator'
import { validateAIOutputIntegrity } from '@/lib/ai-games/ai-answer-validator'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { securityRateLimiter } from '@/lib/security/rate-limiter'
import { safeParseAPI, AIGenerateSchema, sanitizeAIPrompt } from '@/lib/security/input-sanitizer'
import { securityLog } from '@/lib/security/audit-logger'

const DEFAULT_TOPICS: Record<string, string> = {
    mathematics: 'arithmetic',
    math: 'arithmetic',
    science: 'general science',
    biology: 'cells and organisms',
    chemistry: 'elements and compounds',
    physics: 'forces and motion',
    english: 'grammar',
    language: 'grammar',
    hindi: 'vyakaran',
    'social-studies': 'history',
    'social studies': 'history',
    'computer-science': 'algorithms',
    gk: 'general knowledge',
    'gk & life skills': 'life skills',
}

function resolveDefaults(subject: string, topic?: string): { subject: string; topic: string } {
    const s = (subject ?? '').trim().toLowerCase()
    const t = (topic ?? '').trim()
    return {
        subject: s || 'general',
        topic: t || DEFAULT_TOPICS[s] || 'general knowledge',
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id ?? 'anonymous'
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const path = '/api/ai-games/generate'

    // ── Phase 5: Rate limit per user (AI endpoint) ─────────────────────────────
    const [perMinuteResult, dailyResult] = await Promise.all([
        securityRateLimiter.aiGenerate(userId),
        securityRateLimiter.aiDailyCap(userId),
    ])

    if (!perMinuteResult.success) {
        securityLog.rateLimitTriggered('ai_generate:perMinute', ip, userId)
        return NextResponse.json(
            { error: 'Rate limit exceeded — please wait before generating more questions' },
            { status: 429, headers: securityRateLimiter.build429Headers(perMinuteResult) }
        )
    }
    if (!dailyResult.success) {
        securityLog.aiCostCapHit(userId, 200)
        return NextResponse.json(
            { error: 'Daily AI question limit reached. Resets at midnight.' },
            { status: 429, headers: securityRateLimiter.build429Headers(dailyResult) }
        )
    }

    // ── Phase 3: Input validation ──────────────────────────────────────────────
    const rawBody = await req.json().catch(() => ({}))
    const parsed = safeParseAPI(AIGenerateSchema, rawBody)
    if (!parsed.success) {
        securityLog.schemaViolation(path, parsed.error, ip)
        return NextResponse.json({ error: `Invalid input: ${parsed.error}` }, { status: 400 })
    }

    const { subject: rawSubject, topic: rawTopic, gradeBand: rawGradeBand, difficulty, questionType } = parsed.data

    // ── Phase 6: Prompt injection check on topic field ─────────────────────────
    if (rawTopic) {
        const topicSafety = sanitizeAIPrompt(rawTopic, 200)
        if (!topicSafety.safe) {
            securityLog.promptInjection(userId, ip, rawTopic)
            return NextResponse.json({ error: 'Invalid topic content' }, { status: 400 })
        }
    }

    try {
        const { subject, topic } = resolveDefaults(rawSubject ?? 'general', rawTopic)
        const gradeBand = rawGradeBand ?? '68'
        let question = null

        if (questionType === 'essay') {
            question = await generateAIEssayPrompt(gradeBand, subject, topic)
        } else if (subject === 'mathematics' || subject === 'math') {
            question = await generateAIMathQuestion(gradeBand, topic, difficulty ?? 3)
        } else {
            question = await generateAISubjectQuestion(subject, topic, gradeBand, difficulty ?? 3)
        }

        if (!question) {
            return NextResponse.json(
                { error: 'AI generation failed — retrying is safe' },
                { status: 503 }
            )
        }

        const validation = validateAIOutputIntegrity(question)
        if (!validation.passed && questionType !== 'essay') {
            return NextResponse.json(
                { error: 'Generated question failed integrity check', details: validation.errors },
                { status: 503 }
            )
        }

        return NextResponse.json({ question, validation })

    } catch (err) {
        console.error('[ai-games/generate] Unhandled error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
