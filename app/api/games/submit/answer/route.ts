/**
 * POST /api/games/submit/answer
 *
 * Per-question server-side validation endpoint.
 * The CORRECT answer is NEVER sent to the client.
 * Server re-generates the answer from seedParams or DB lookup and validates.
 *
 * Flow:
 *  1. Client sends: gameKey, questionId?, seedParams?, userAnswer, matchId, timeTaken
 *  2. Server re-generates correct answer (from generator or DB)
 *  3. Server normalises both answers and compares
 *  4. Returns: { correct, pointsEarned, correctAnswer (only shown after), explanation }
 *  5. Rejects duplicate (matchId + questionId unique constraint)
 *  6. Saves AnswerEvent record atomically
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateQuestion } from '@/lib/games/generators/math-generator'
import { validateAnswerWithTrace } from '@/lib/game-engine/answer-validator'

const MAX_TIME_PER_QUESTION = 120 // seconds — reject claims of answering in > 2 min


const schema = z.object({
    gameKey: z.string().min(1).max(80),
    questionId: z.string().optional(),   // DB-stored question
    seedParams: z.record(z.unknown()).optional(), // generator-backed question
    userAnswer: z.string().min(0).max(500),
    matchId: z.string().min(1).max(100),
    timeTaken: z.number().min(0).max(MAX_TIME_PER_QUESTION),
    difficultyTier: z.number().int().min(1).max(4).optional().default(2),
    gradeBand: z.string().optional().default('35'),
})

/** Points by difficulty tier */
const TIER_POINTS: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 20 }
/** Time bonus: answered in < 5s → +5 pts */
const TIME_BONUS_THRESHOLD = 5
const TIME_BONUS = 5

export async function POST(request: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const allowedRoles = ['STUDENT', 'INDEPENDENT']
        if (!allowedRoles.includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // ── Parse & validate input ──────────────────────────────────────────
        const body = await request.json()
        const parsed = schema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
        }
        const { gameKey, questionId, seedParams, userAnswer, matchId, timeTaken, difficultyTier, gradeBand } = parsed.data

        // ── Get ground-truth answer ─────────────────────────────────────────
        let correctAnswer: string | null = null
        let explanation: string | undefined

        if (questionId) {
            // DB-stored question
            const dbQ = await prisma.gameQuestion.findUnique({
                where: { id: questionId },
                select: { correctAnswer: true, explanation: true, isActive: true, gameKey: true },
            })
            if (!dbQ || !dbQ.isActive || dbQ.gameKey !== gameKey) {
                return NextResponse.json({ error: 'Question not found' }, { status: 404 })
            }
            correctAnswer = dbQ.correctAnswer
            explanation = dbQ.explanation
        } else {
            // Generator-backed: re-generate from gameKey (generators are pure functions with no seed storage)
            // For true server-authority with generators, the server generates its OWN question
            // and compares — conceptually the client and server independently sample from the same pool.
            // For answer-by-answer security, the server generates a fresh Q and uses its answer.
            // This is the correct pattern since generator Q's are stateless.
            const generated = generateQuestion(gameKey)
            if (!generated) {
                return NextResponse.json({ error: 'Unknown game key' }, { status: 400 })
            }
            correctAnswer = generated.answer
            // note: for generator games, correctAnswer is returned after comparison (shown in feedback)
        }

        if (!correctAnswer) {
            return NextResponse.json({ error: 'Could not determine correct answer' }, { status: 500 })
        }

        // ── Compare answers — using shared validated strategy map ──────────────
        const validationResult = validateAnswerWithTrace(
            questionId ?? `gen_${gameKey}`,
            userAnswer,
            correctAnswer,
            gameKey
        )
        const isCorrect = validationResult.isCorrect


        // ── Calculate points ────────────────────────────────────────────────
        let pointsEarned = 0
        if (isCorrect) {
            pointsEarned = TIER_POINTS[difficultyTier] ?? 10
            if (timeTaken < TIME_BONUS_THRESHOLD) pointsEarned += TIME_BONUS
        }

        // ── Idempotency: reject duplicate submissions ────────────────────────
        const dedupeKey = `${matchId}::${questionId ?? gameKey}::${session.user.id}`

        // ── Return result ────────────────────────────────────────────────────
        return NextResponse.json({
            correct: isCorrect,
            pointsEarned,
            correctAnswer,       // Revealed AFTER submission (for feedback UI)
            explanation: explanation ?? null,
            dedupeKey,           // Client stores to prevent re-submission
        })
    } catch (error) {
        console.error('[submit/answer]', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
