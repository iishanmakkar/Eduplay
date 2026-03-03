import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'
import {
    generateClassroomCode,
    ClassroomSession,
    ClassroomPlayer,
    GameQuestion
} from '@/lib/game-engine/game-session'
import { MathEngine } from '@/lib/game-engine/math-engine'

/**
 * POST /api/games/classroom/create
 * Teacher creates a classroom session. Returns a 6-character code.
 * Session stored in Redis with 2-hour expiry.
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Only teachers can create classroom sessions' }, { status: 403 })
    }

    const { gameType, questionCount = 10, difficulty = 2 } = await req.json()

    if (!gameType) {
        return NextResponse.json({ error: 'gameType is required' }, { status: 400 })
    }

    // Generate unique 6-char code (retry if collision)
    let code = ''
    let attempts = 0
    while (attempts < 10) {
        code = generateClassroomCode()
        const existing = await redis.get(`classroom:${code}`)
        if (!existing) break
        attempts++
    }

    if (!code) {
        return NextResponse.json({ error: 'Could not generate unique session code' }, { status: 500 })
    }

    // Generate math questions server-side (using MathEngine)
    const diffs: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'CHALLENGE'> = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE']
    const engineDiff = diffs[Math.min(difficulty - 1, 3)]

    const questions: Array<GameQuestion & { correctAnswer: string }> = []
    for (let i = 0; i < questionCount; i++) {
        const prob = MathEngine.generateProblem({
            difficulty: engineDiff,
            allowNegatives: difficulty >= 3,
            maxSteps: difficulty >= 3 ? 2 : 1
        })

        const { randomUUID } = await import('crypto')
        questions.push({
            id: randomUUID(),
            display: prob.expression,
            type: 'MCQ',
            options: prob.options?.map(String) ?? [],
            skillCode: `MATH.${engineDiff}`,
            difficultyLevel: difficulty as 1 | 2 | 3 | 4,
            timeLimit: difficulty <= 2 ? 20 : difficulty === 3 ? 15 : 10,
            correctAnswer: String(prob.answer)
        })
    }

    const classroomSession: ClassroomSession = {
        code,
        teacherId: session.user.id,
        gameType,
        questions,
        players: new Map(),
        status: 'LOBBY',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    }

    // Serialize Map to plain object for Redis
    const serialized = {
        ...classroomSession,
        players: {}
    }

    await redis.set(
        `classroom:${code}`,
        JSON.stringify(serialized),
        { ex: 2 * 60 * 60 } // 2 hours
    )

    // Return session WITHOUT correct answers
    return NextResponse.json({
        code,
        gameType,
        questionCount: questions.length,
        status: 'LOBBY',
        createdAt: classroomSession.createdAt,
        expiresAt: classroomSession.expiresAt,
        joinUrl: `/play/classroom/${code}`
    })
}
