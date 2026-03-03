import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'

/**
 * POST /api/games/classroom/[code]/start
 * Teacher starts the session — moves status from LOBBY → COUNTDOWN → ACTIVE.
 * Returns the full question set (without correct answers) so all clients sync.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Only teachers can start sessions' }, { status: 403 })
    }

    const code = params.code.toUpperCase()
    const raw = await redis.get(`classroom:${code}`)
    if (!raw) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const classroomSession = JSON.parse(raw as string)

    if (classroomSession.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Only the session creator can start it' }, { status: 403 })
    }

    if (classroomSession.status !== 'LOBBY') {
        return NextResponse.json({
            error: `Session is already ${classroomSession.status}`,
            status: classroomSession.status
        }, { status: 409 })
    }

    const playerCount = Object.keys(classroomSession.players).length
    if (playerCount < 1) {
        return NextResponse.json({ error: 'No students have joined yet' }, { status: 400 })
    }

    // Move to ACTIVE (clients handle 3-2-1 countdown animation locally)
    classroomSession.status = 'ACTIVE'
    classroomSession.startedAt = Date.now()
    classroomSession.currentQuestionIndex = 0

    // Active session TTL: 45 minutes
    await redis.set(`classroom:${code}`, JSON.stringify(classroomSession), { ex: 45 * 60 })

    // Return safe questions (no correct answers)
    const safeQuestions = classroomSession.questions.map((q: any) => ({
        id: q.id,
        display: q.display,
        type: q.type,
        options: q.options,
        skillCode: q.skillCode,
        difficultyLevel: q.difficultyLevel,
        timeLimit: q.timeLimit
    }))

    return NextResponse.json({
        success: true,
        status: 'ACTIVE',
        startedAt: classroomSession.startedAt,
        questions: safeQuestions,
        playerCount
    })
}

/**
 * GET /api/games/classroom/[code]/start
 * Poll endpoint — returns current session status (LOBBY → ACTIVE).
 * Used by students waiting for teacher to start.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const code = params.code.toUpperCase()
    const raw = await redis.get(`classroom:${code}`)
    if (!raw) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const cs = JSON.parse(raw as string)

    return NextResponse.json({
        code,
        status: cs.status,
        playerCount: Object.keys(cs.players).length,
        gameType: cs.gameType,
        startedAt: cs.startedAt ?? null
    })
}
