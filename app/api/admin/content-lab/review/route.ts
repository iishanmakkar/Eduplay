import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Roles that can access the admin content lab
const ADMIN_ROLES = ['OWNER', 'SCHOOL', 'TEACHER']

// POST /api/admin/content-lab/review — save questions to review queue
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { questions } = await req.json()
    if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: 'questions array required' }, { status: 400 })
    }

    // Insert into GameQuestion with isActive=false (pending review)
    const created = await prisma.$transaction(
        questions.slice(0, 100).map((q: {
            prompt: string; correctAnswer?: string; answerOptions?: string[]
            gameKey?: string; gradeBand?: string; difficultyLevel?: number
            explanation?: string; subjectTag?: string; skillTag?: string
        }) =>
            prisma.gameQuestion.create({
                data: {
                    questionText: q.prompt ?? '',
                    correctAnswer: q.correctAnswer ?? '',
                    answerOptions: JSON.stringify(q.answerOptions ?? []),
                    gameKey: q.gameKey ?? 'AI_GENERATED',
                    gradeBand: q.gradeBand ?? '68',
                    difficultyTier: q.difficultyLevel ?? 3,
                    explanation: q.explanation ?? '',
                    isActive: false,  // Pending review — not visible to students
                    standardAlignment: q.subjectTag,
                    skillTag: q.skillTag ?? 'general',
                    subjectTag: q.subjectTag ?? 'general',
                }
            })
        )
    )

    return NextResponse.json({ saved: created.length })
}

// GET /api/admin/content-lab/review — fetch pending review queue
export async function GET(_req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const questions = await prisma.gameQuestion.findMany({
        where: { isActive: false },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            id: true, questionText: true, correctAnswer: true, answerOptions: true,
            gameKey: true, gradeBand: true, difficultyTier: true,
            explanation: true, createdAt: true,
        }
    })

    return NextResponse.json({ questions })
}
