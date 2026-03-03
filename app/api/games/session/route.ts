import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'
import { prisma } from '@/lib/prisma'
import {
    createSessionSkeleton,
    buildQuestionHash,
    signSession,
    generateClassroomCode,
    type GameMode,
    type GameQuestion,
    type GameSessionInternal,
} from '@/lib/game-engine/game-session'
import { MathEngine } from '@/lib/game-engine/math-engine'
import { GradeMapper } from '@/lib/game-engine/grade-mapper'
import { getGradeDifficultyConfig } from '@/lib/game-engine/grade-difficulty-map'
import { AdaptiveDifficulty } from '@/lib/game-engine/adaptive-difficulty'
import { randomUUID } from 'crypto'

const SESSION_TTL_SEC = 30 * 60  // 30 minutes

function redisSessionKey(sessionId: string): string {
    return `gamesession:${sessionId}`
}

// ── Active session deduplication ─────────────────────────────────────────────
function activeSessionKey(userId: string): string {
    return `gamesession:active:${userId}`
}

/**
 * POST /api/games/session
 *
 * Creates a server-side game session for any solo game.
 * Questions are generated server-side. Correct answers are NEVER sent to the client.
 *
 * Body: { gameType, difficulty, grade, mode? }
 * Returns: GameSession (questions WITHOUT correctAnswer) + sessionId + questionHash
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Student session required' }, { status: 401 })
    }

    const userId = session.user.id
    const { gameType, difficulty = 2, grade = '35', mode = 'SOLO' } = await req.json()

    if (!gameType || typeof gameType !== 'string') {
        return NextResponse.json({ error: 'gameType is required' }, { status: 400 })
    }

    // Multi-tab detection: reject if student already has an active session
    const existingSessionId = await redis.get(activeSessionKey(userId))
    if (existingSessionId) {
        // Verify the existing session is actually still valid (not expired)
        const existing = await redis.get(redisSessionKey(existingSessionId as string))
        if (existing) {
            return NextResponse.json({
                error: 'You already have an active game session. Please complete or abandon it first.',
                existingSessionId
            }, { status: 409 })
        }
        // Stale pointer — clean up
        await redis.del(activeSessionKey(userId))
    }

    // Validate school subscription
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { school: { select: { subscription: { select: { status: true } } } } }
    })
    const subStatus = user?.school?.subscription?.status
    if (subStatus !== 'ACTIVE' && subStatus !== 'TRIALING') {
        return NextResponse.json({ error: 'School subscription is not active' }, { status: 403 })
    }

    // Generate questions server-side based on gameType
    const gradeConfig = getGradeDifficultyConfig(String(grade))
    const diffs: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'CHALLENGE'> =
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE']
    let engineDiff = diffs[Math.min((difficulty as number) - 1, 3)]

    let timeLimitMultiplier = 1.0

    // Burnout Check & Stealth Assist
    if (userId) {
        const perf = await AdaptiveDifficulty.analyzePerformance(userId, gameType as any)
        if (perf.burnoutStatus === 'severe') {
            engineDiff = diffs[Math.max(0, diffs.indexOf(engineDiff) - 1)] // Drop difficulty tier stealthily
            timeLimitMultiplier = 1.5 // 50% extra time
        } else if (perf.burnoutStatus === 'mild') {
            timeLimitMultiplier = 1.25 // 25% extra time
        }
    }

    const questionCount = isMathGame(gameType) ? 15 : 10
    const questions: GameQuestion[] = []
    const correctAnswers: string[] = []

    for (let i = 0; i < questionCount; i++) {
        const prob = MathEngine.generateProblem({
            difficulty: engineDiff,
            allowNegatives: gradeConfig.allowNegatives && (difficulty as number) >= 3,
            maxSteps: gradeConfig.cognitiveProfile.maxSteps,
            customRange: gradeConfig.numberRange,
        })

        const qId = randomUUID()
        const skillCode = deriveSkillCode(prob.expression)

        questions.push({
            id: qId,
            display: prob.expression,
            type: 'MCQ',
            options: prob.options?.map(String) ?? [],
            skillCode,
            difficultyLevel: difficulty as 1 | 2 | 3 | 4,
            timeLimit: Math.round(gradeConfig.timeLimit * timeLimitMultiplier),
        })
        correctAnswers.push(String(prob.answer))
    }

    // Build session skeleton
    const { sessionId, expiresAt, serverTimestamp } = createSessionSkeleton({
        gameType,
        mode: mode as GameMode,
        studentId: userId,
        grade: String(grade),
    })

    const questionHash = buildQuestionHash(sessionId, questions, correctAnswers)

    // Store internal session in Redis (WITH correct answers)
    const internal: GameSessionInternal = {
        sessionId,
        gameType,
        mode: mode as GameMode,
        questions,
        serverTimestamp,
        questionHash,
        studentId: userId,
        expiresAt,
        grade: String(grade),
        correctAnswers,
        used: false,
    }

    await Promise.all([
        redis.set(redisSessionKey(sessionId), JSON.stringify(internal), { ex: SESSION_TTL_SEC }),
        redis.set(activeSessionKey(userId), sessionId, { ex: SESSION_TTL_SEC }),
    ])

    // Return public session (NO correctAnswers)
    return NextResponse.json({
        sessionId,
        gameType,
        mode,
        grade,
        serverTimestamp,
        questionHash,
        expiresAt,
        questions,   // correctAnswer field intentionally absent from GameQuestion type
    })
}

// ── DELETE /api/games/session — abandon session without saving ────────────────
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId } = await req.json()
    await Promise.all([
        redis.del(redisSessionKey(sessionId)),
        redis.del(activeSessionKey(session.user.id)),
    ])

    return NextResponse.json({ success: true, message: 'Session abandoned' })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMathGame(gameType: string): boolean {
    return ['SPEED_MATH', 'MATH_GRID', 'MATH_SUDOKU'].includes(gameType)
}

function deriveSkillCode(expression: string): string {
    if (expression.includes('×')) return 'MATH.MULT'
    if (expression.includes('÷')) return 'MATH.DIV'
    if (expression.includes('+')) return 'MATH.ADD'
    if (expression.includes('-')) return 'MATH.SUB'
    return 'MATH.GENERIC'
}
