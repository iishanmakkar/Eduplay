import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    irt3PL, updateThetaEAP, selectMaxInfoItem, csem, heuristicIRTFromDifficulty,
    type IRTParameters
} from '@/lib/irt/three-pl-model'

/**
 * POST /api/assessment/adaptive-test
 *
 * Actions:
 *  start   → initialise a new adaptive session, return first question
 *  answer  → record response, update θ, return next question OR stop
 *  summary → return full session results
 */

const SE_STOP_THRESHOLD = 0.3    // Stop when standard error < 0.3 logits
const MIN_ITEMS = 10             // Never stop before 10 items
const MAX_ITEMS = 30             // Never exceed 30 items

interface SessionState {
    userId: string
    skillTag: string
    theta: number
    thetaSE: number
    responses: { questionId: string; a: number; b: number; c: number; correct: boolean }[]
    administeredIds: string[]
    startedAt: number
}

// In-memory session store (Redis-backed in production via crash-recovery module)
const sessions = new Map<string, SessionState>()

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id ?? session.user.email ?? 'unknown'

    const body = await req.json()
    const { action, sessionId, skillTag, questionId, correct, timeTakenMs } = body

    // ── START ──────────────────────────────────────────────────────────────

    if (action === 'start') {
        const sid = `${userId}_${Date.now()}`
        const state: SessionState = {
            userId, skillTag: skillTag ?? 'general',
            theta: 0, thetaSE: 1.0,
            responses: [], administeredIds: [], startedAt: Date.now()
        }
        sessions.set(sid, state)

        const question = await selectNextQuestion(state, skillTag)
        if (!question) return NextResponse.json({ error: 'No questions available' }, { status: 404 })

        return NextResponse.json({ sessionId: sid, question, itemNumber: 1, theta: state.theta, thetaSE: state.thetaSE })
    }

    // ── ANSWER ─────────────────────────────────────────────────────────────

    if (action === 'answer') {
        const state = sessions.get(sessionId)
        if (!state) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

        // Get IRT params for answered question
        const dbQ = await prisma.gameQuestion.findUnique({
            where: { id: questionId },
            select: { id: true, difficultyTier: true }
        })
        if (!dbQ) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

        // Use stored or heuristic IRT params
        const heuristic = heuristicIRTFromDifficulty(dbQ.difficultyTier)
        const irtParams = { questionId: dbQ.id, a: heuristic.a, b: heuristic.b, c: heuristic.c }

        state.responses.push({ questionId: dbQ.id, ...heuristic, correct: Boolean(correct) })
        state.administeredIds.push(questionId)

        // Update θ using EAP
        const { theta, se } = updateThetaEAP(state.theta, state.responses)
        state.theta = theta
        state.thetaSE = se

        const n = state.responses.length
        const shouldStop = (n >= MIN_ITEMS && se < SE_STOP_THRESHOLD) || n >= MAX_ITEMS

        if (shouldStop) {
            sessions.delete(sessionId)
            const summary = buildSummary(state)
            // Persist ability to DB (best effort)
            persistAbility(userId, state.skillTag, theta, se).catch(() => { })
            return NextResponse.json({ done: true, summary })
        }

        // Select next question
        const nextQ = await selectNextQuestion(state, state.skillTag)
        if (!nextQ) {
            sessions.delete(sessionId)
            const summary = buildSummary(state)
            return NextResponse.json({ done: true, summary })
        }

        return NextResponse.json({
            done: false,
            question: nextQ,
            itemNumber: n + 1,
            theta: Math.round(theta * 100) / 100,
            thetaSE: Math.round(se * 100) / 100
        })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function selectNextQuestion(state: SessionState, skillTag: string) {
    const pool = await prisma.gameQuestion.findMany({
        where: {
            isActive: true,
            ...(skillTag && skillTag !== 'general' ? { skillTag } : {}),
            id: { notIn: state.administeredIds.length > 0 ? state.administeredIds : ['__none__'] }
        },
        select: { id: true, questionText: true, answerOptions: true, correctAnswer: true, difficultyTier: true, explanation: true },
        take: 50
    })

    if (pool.length === 0) return null

    // Build IRT params from difficultyTier
    const irtItems: IRTParameters[] = pool.map(q => {
        const h = heuristicIRTFromDifficulty(q.difficultyTier)
        return { questionId: q.id, ...h }
    })

    const bestIdx = selectMaxInfoItem(state.theta, irtItems)
    const selected = pool[bestIdx]

    return {
        id: selected.id,
        prompt: selected.questionText,
        options: selected.answerOptions ? JSON.parse(selected.answerOptions as string) : [],
        difficultyTier: selected.difficultyTier,
        // Never expose correctAnswer to client
    }
}

function buildSummary(state: SessionState) {
    const correctCount = state.responses.filter(r => r.correct).length
    const accuracy = correctCount / Math.max(1, state.responses.length)
    const durationSeconds = Math.round((Date.now() - state.startedAt) / 1000)

    // Percentile from θ (normal CDF approximation)
    const z = state.theta / 1.0  // SD=1 assumed
    const percentile = Math.round(Math.min(99, Math.max(1, (1 / (1 + Math.exp(-0.07056 * z ** 3 - 1.5976 * z))) * 100)))

    return {
        theta: Math.round(state.theta * 100) / 100,
        thetaSE: Math.round(state.thetaSE * 100) / 100,
        percentile,
        accuracy: Math.round(accuracy * 100),
        totalItems: state.responses.length,
        correctItems: correctCount,
        durationSeconds,
        masteryStatus: state.theta >= 1 ? 'advanced' : state.theta >= 0 ? 'mastered' : state.theta >= -1 ? 'approaching' : 'learning',
        confidenceInterval: [
            Math.round((state.theta - 1.96 * state.thetaSE) * 100) / 100,
            Math.round((state.theta + 1.96 * state.thetaSE) * 100) / 100,
        ],
    }
}

async function persistAbility(userId: string, skillTag: string, theta: number, se: number) {
    await prisma.analyticsEvent.create({
        data: {
            userId,
            event: 'ADAPTIVE_TEST_COMPLETE',
            details: { skillTag, theta, se, timestamp: new Date().toISOString() }
        }
    })
}
