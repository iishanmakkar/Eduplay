import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/cache/redis'

/**
 * GET /api/games/classroom/[code]/export
 * Export classroom session results as CSV or JSON.
 * Teacher-only. Session must be ACTIVE or FINISHED.
 *
 * Query params:
 *   format=csv|json (default: csv)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const code = params.code.toUpperCase()
    const raw = await redis.get(`classroom:${code}`)
    if (!raw) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const cs = JSON.parse(raw as string)

    if (cs.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied — not your session' }, { status: 403 })
    }

    const format = req.nextUrl.searchParams.get('format') ?? 'csv'
    const players = Object.values(cs.players) as any[]

    // Build ranked rows
    const ranked = players
        .sort((a: any, b: any) => b.score - a.score)
        .map((p: any, index) => ({
            rank: index + 1,
            student_id: p.studentId,
            display_name: p.displayName,
            score: p.score,
            correct_count: p.answers.filter((a: any) => a.isCorrect).length,
            total_answered: p.answers.length,
            accuracy_pct: p.answers.length > 0
                ? Math.round(p.answers.filter((a: any) => a.isCorrect).length / p.answers.length * 100)
                : 0,
            joined_at: new Date(p.joinedAt).toISOString(),
            answers: p.answers.map((a: any) => ({
                q: a.questionIndex + 1,
                submitted: a.submitted,
                correct: a.isCorrect,
                time_ms: a.timeMs
            }))
        }))

    if (format === 'json') {
        return NextResponse.json({
            code,
            gameType: cs.gameType,
            status: cs.status,
            startedAt: cs.startedAt ? new Date(cs.startedAt).toISOString() : null,
            exportedAt: new Date().toISOString(),
            questions: cs.questions.map((q: any, i: number) => ({
                index: i + 1,
                display: q.display,
                correctAnswer: q.correctAnswer
            })),
            rankings: ranked
        })
    }

    // CSV format
    const headers = [
        'rank', 'display_name', 'score', 'correct_count',
        'total_answered', 'accuracy_pct',
        ...cs.questions.map((_: any, i: number) => `q${i + 1}_correct`),
        ...cs.questions.map((_: any, i: number) => `q${i + 1}_answer`)
    ]

    const rows = ranked.map(p => {
        const qCorrect = cs.questions.map((_: any, i: number) => {
            const ans = p.answers.find((a: any) => a.q === i + 1)
            return ans ? (ans.correct ? 'Y' : 'N') : 'skipped'
        })
        const qAnswers = cs.questions.map((_: any, i: number) => {
            const ans = p.answers.find((a: any) => a.q === i + 1)
            return ans ? `"${ans.submitted}"` : '""'
        })
        return [
            p.rank, `"${p.display_name}"`, p.score, p.correct_count,
            p.total_answered, p.accuracy_pct,
            ...qCorrect, ...qAnswers
        ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="classroom-${code}-${Date.now()}.csv"`
        }
    })
}
