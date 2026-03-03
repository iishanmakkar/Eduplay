import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'
import { ClassroomPlayer } from '@/lib/game-engine/game-session'

/**
 * POST /api/games/classroom/join
 * Student joins a classroom session via 6-character code.
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Only students can join classroom sessions' }, { status: 403 })
    }

    const { code } = await req.json()

    if (!code || typeof code !== 'string' || code.length !== 6) {
        return NextResponse.json({ error: 'Invalid session code' }, { status: 400 })
    }

    const raw = await redis.get(`classroom:${code.toUpperCase()}`)
    if (!raw) {
        return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
    }

    const classroomSession = JSON.parse(raw as string)

    if (classroomSession.status === 'FINISHED') {
        return NextResponse.json({ error: 'This session has already ended' }, { status: 410 })
    }

    if (classroomSession.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Session already started — cannot join mid-game' }, { status: 409 })
    }

    const playerCount = Object.keys(classroomSession.players).length
    if (playerCount >= 60) {
        return NextResponse.json({ error: 'Classroom session is full (max 60 students)' }, { status: 429 })
    }

    // Register player (idempotent — re-joining is OK while in LOBBY)
    const player: ClassroomPlayer = classroomSession.players[session.user.id] ?? {
        studentId: session.user.id,
        displayName: session.user.name ?? session.user.email ?? 'Student',
        answers: [],
        score: 0,
        joinedAt: Date.now(),
        lastHeartbeat: Date.now()
    }

    // Update heartbeat
    player.lastHeartbeat = Date.now()
    classroomSession.players[session.user.id] = player

    const ttl = Math.floor((classroomSession.expiresAt - Date.now()) / 1000)
    await redis.set(`classroom:${code.toUpperCase()}`, JSON.stringify(classroomSession), { ex: Math.max(ttl, 60) })

    // Return session info (no correct answers)
    const safeQuestions = classroomSession.questions.map((q: any) => ({
        id: q.id,
        display: q.display,
        type: q.type,
        options: q.options,
        hint: q.hint,
        skillCode: q.skillCode,
        difficultyLevel: q.difficultyLevel,
        timeLimit: q.timeLimit
        // correctAnswer intentionally omitted
    }))

    return NextResponse.json({
        success: true,
        code: code.toUpperCase(),
        gameType: classroomSession.gameType,
        status: classroomSession.status,
        questions: safeQuestions,
        playerCount: Object.keys(classroomSession.players).length,
        teacherId: classroomSession.teacherId
    })
}
