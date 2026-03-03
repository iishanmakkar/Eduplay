import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'
import { validateAnswer } from '@/lib/game-engine/answer-validator'
import { ScoringEngine } from '@/lib/game-engine/scoring'

/**
 * POST /api/games/classroom/[code]/submit
 * Student submits an answer for the current question.
 * Idempotent: duplicate submissions for same (studentId, questionIndex) are ignored.
 *
 * Body: { questionIndex: number, submitted: string, timeMs: number }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code.toUpperCase()
    const raw = await redis.get(`classroom:${code}`)
    if (!raw) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const cs = JSON.parse(raw as string)

    if (cs.status !== 'ACTIVE') {
        return NextResponse.json({ error: `Session is ${cs.status}` }, { status: 409 })
    }

    const { questionIndex, submitted, timeMs } = await req.json()

    if (typeof questionIndex !== 'number' || questionIndex < 0 || questionIndex >= cs.questions.length) {
        return NextResponse.json({ error: 'Invalid questionIndex' }, { status: 400 })
    }

    if (typeof submitted !== 'string') {
        return NextResponse.json({ error: 'submitted must be a string' }, { status: 400 })
    }

    // Speed cap: minimum 400ms per answer
    if (typeof timeMs === 'number' && timeMs < 400) {
        return NextResponse.json({ error: 'Answer submitted too fast (min 400ms)' }, { status: 429 })
    }

    const player = cs.players[session.user.id]
    if (!player) {
        return NextResponse.json({ error: 'You have not joined this session' }, { status: 403 })
    }

    // Idempotency: check if already answered this question
    const alreadyAnswered = player.answers.some((a: any) => a.questionIndex === questionIndex)
    if (alreadyAnswered) {
        return NextResponse.json({ success: true, message: 'Already submitted for this question' })
    }

    // Server-side answer validation
    const question = cs.questions[questionIndex]
    const validation = validateAnswer(submitted, question.correctAnswer, cs.gameType)

    // Calculate XP for this question
    const xp = validation.isCorrect
        ? ScoringEngine.calculateXP({
            baseScore: 100,
            accuracy: 1,
            timeSpent: (timeMs ?? 5000) / 1000,
            expectedTime: question.timeLimit,
            streak: player.answers.filter((a: any) => a.isCorrect).length,
            hintsUsed: 0,
            mistakes: player.answers.filter((a: any) => !a.isCorrect).length,
            difficulty: question.difficultyLevel
        }).totalXP
        : 0

    // Record answer (atomic update)
    player.answers.push({
        questionIndex,
        submitted,
        isCorrect: validation.isCorrect,
        timeMs: timeMs ?? null
    })
    player.score = (player.score || 0) + xp
    player.lastHeartbeat = Date.now()

    cs.players[session.user.id] = player

    // Check if all questions answered → mark finished for this player
    const allAnswered = player.answers.length >= cs.questions.length
    if (allAnswered) {
        player.finishedAt = Date.now()
    }

    const ttl = Math.floor((cs.expiresAt - Date.now()) / 1000)
    await redis.set(`classroom:${code}`, JSON.stringify(cs), { ex: Math.max(ttl, 60) })

    return NextResponse.json({
        success: true,
        isCorrect: validation.isCorrect,
        correctAnswer: validation.isCorrect ? undefined : question.correctAnswer, // only reveal on wrong
        xpEarned: xp,
        playerScore: player.score,
        questionIndex
    })
}
