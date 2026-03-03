/**
 * FERPA-Compliant Student Data Export API
 * GET /api/export/school/[id]/students
 * GET /api/export/school/[id]/students?format=csv
 *
 * Required for US district procurement compliance:
 * - FERPA mandates districts can access student education records within 45 days of request.
 * - Data portability: export includes profile, game results, skill mastery, audit logs.
 *
 * Access control:
 * - SCHOOL role: can only export their own school's data (schoolId must match)
 * - OWNER role: can export any school's data
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ExportFormat = 'json' | 'csv'

function toCSV(rows: Record<string, any>[], headers: string[]): string {
    const escape = (v: any) => {
        const s = v === null || v === undefined ? '' : String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s
    }
    const lines = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ]
    return lines.join('\n')
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // ── Auth ──────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, schoolId: sessionSchoolId } = session.user as any

    if (role !== 'SCHOOL' && role !== 'OWNER') {
        return NextResponse.json({ error: 'Forbidden: requires SCHOOL or OWNER role' }, { status: 403 })
    }

    // SCHOOL role can only export their own school
    if (role === 'SCHOOL' && sessionSchoolId !== params.id) {
        return NextResponse.json({ error: 'Forbidden: school mismatch' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format: ExportFormat = searchParams.get('format') === 'csv' ? 'csv' : 'json'
    const since90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // ── Fetch all data ────────────────────────────────────────────────────
    const students = await prisma.user.findMany({
        where: {
            schoolId: params.id,
            role: 'STUDENT',
            deletedAt: null,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dob: true,
            consentStatus: true,
            createdAt: true,
            xp: true,
            level: true,
            gameResults: {
                where: { completedAt: { gte: since90Days } },
                select: {
                    id: true,
                    gameType: true,
                    score: true,
                    accuracy: true,
                    timeSpent: true,
                    xpEarned: true,
                    completedAt: true,
                    difficulty: true,
                },
                orderBy: { completedAt: 'desc' },
            },
            skillMasteries: {
                select: {
                    skill: { select: { code: true, name: true, subject: true } },
                    masteryProbability: true,
                    totalAttempts: true,
                    lastPracticedAt: true,
                },
            },
            auditLogs: {
                where: { createdAt: { gte: since90Days } },
                select: {
                    action: true,
                    resource: true,
                    resourceId: true,
                    ipAddress: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            },
        },
    })

    const exportedAt = new Date().toISOString()

    // ── JSON format ───────────────────────────────────────────────────────
    if (format === 'json') {
        return NextResponse.json({
            schoolId: params.id,
            exportedAt,
            studentCount: students.length,
            gameResultsWindow: 'last 90 days',
            auditLogsWindow: 'last 90 days (max 50 per student)',
            students,
        }, {
            headers: {
                'Content-Disposition': `attachment; filename="students-${params.id}-${exportedAt.split('T')[0]}.json"`,
            },
        })
    }

    // ── CSV format — flatten to rows ──────────────────────────────────────
    const rows = students.flatMap((s) =>
        s.gameResults.length > 0
            ? s.gameResults.map((gr) => ({
                studentId: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                dob: s.dob?.toISOString().split('T')[0] ?? '',
                consentStatus: String(s.consentStatus),
                xp: s.xp,
                level: s.level,
                gameType: gr.gameType,
                score: gr.score,
                accuracy: Math.round(gr.accuracy * 100) + '%',
                timeSpent: gr.timeSpent,
                xpEarned: gr.xpEarned,
                difficulty: gr.difficulty,
                completedAt: gr.completedAt.toISOString(),
            }))
            : [{
                studentId: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                dob: s.dob?.toISOString().split('T')[0] ?? '',
                consentStatus: String(s.consentStatus),
                xp: s.xp,
                level: s.level,
                gameType: '',
                score: 0,
                accuracy: '',
                timeSpent: 0,
                xpEarned: 0,
                difficulty: '',
                completedAt: '',
            }]
    )

    const headers = ['studentId', 'firstName', 'lastName', 'email', 'dob', 'consentStatus', 'xp', 'level',
        'gameType', 'score', 'accuracy', 'timeSpent', 'xpEarned', 'difficulty', 'completedAt']

    const csv = toCSV(rows as unknown as Record<string, any>[], headers)

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="students-${params.id}-${exportedAt.split('T')[0]}.csv"`,
        },
    })
}
