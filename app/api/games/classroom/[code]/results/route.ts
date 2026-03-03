import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'

/**
 * GET /api/games/classroom/[code]/results
 * Returns the live ranked leaderboard for the classroom session.
 * Usable during ACTIVE and FINISHED states.
 * Teachers see correctAnswer for each question; students do not.
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
    const isTeacher = session.user.role === 'TEACHER' && cs.teacherId === session.user.id

    // Rank players by score (desc), then by time of last answer (asc) for tie-breaking
    const players = Object.values(cs.players) as any[]
    const ranked = players
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            // Tie-break: who finished faster
            const aTime = a.answers[a.answers.length - 1]?.timeMs ?? Infinity
            const bTime = b.answers[b.answers.length - 1]?.timeMs ?? Infinity
            return aTime - bTime
        })
        .map((p, index) => ({
            rank: index + 1,
            studentId: p.studentId,
            displayName: p.displayName,
            score: p.score,
            correctCount: p.answers.filter((a: any) => a.isCorrect).length,
            totalAnswered: p.answers.length,
            accuracy: p.answers.length > 0
                ? Math.round(p.answers.filter((a: any) => a.isCorrect).length / p.answers.length * 100)
                : 0
        }))

    // Teacher gets question-level correctness breakdown
    const questionBreakdown = isTeacher
        ? cs.questions.map((q: any, i: number) => ({
            questionIndex: i,
            display: q.display,
            correctAnswer: q.correctAnswer,
            correctCount: players.filter(p => p.answers.find((a: any) => a.questionIndex === i && a.isCorrect)).length,
            totalAttempted: players.filter(p => p.answers.find((a: any) => a.questionIndex === i)).length
        }))
        : undefined

    return NextResponse.json({
        code,
        status: cs.status,
        gameType: cs.gameType,
        totalPlayers: players.length,
        startedAt: cs.startedAt,
        rankings: ranked,
        ...(questionBreakdown ? { questionBreakdown } : {})
    })
}
