import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateClassCode } from '@/lib/utils'

const createClassSchema = z.object({
    name: z.string().min(1),
    grade: z.string().min(1),
    subject: z.enum(['MATH', 'ENGLISH', 'SCIENCE', 'GEOGRAPHY']).optional(),
    emoji: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const classes = await prisma.class.findMany({
            where: {
                teacherId: session.user.id,
            },
            include: {
                students: {
                    include: {
                        student: true,
                    },
                },
                assignments: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json({ classes })
    } catch (error) {
        console.error('Get classes error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = createClassSchema.parse(body)

        // Security Audit: Check class limits
        const { checkLimit } = await import('@/lib/limits/check')
        const limitCheck = await checkLimit(session.user.schoolId, 'classes')

        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: `Class limit reached for ${limitCheck.plan} plan. Upgrade to create more.` },
                { status: 403 }
            )
        }

        // Generate unique class code
        let classCode = generateClassCode()
        let existingClass = await prisma.class.findUnique({
            where: { classCode },
        })

        while (existingClass) {
            classCode = generateClassCode()
            existingClass = await prisma.class.findUnique({
                where: { classCode },
            })
        }

        const newClass = await prisma.class.create({
            data: {
                name: validatedData.name,
                grade: validatedData.grade,
                subject: validatedData.subject,
                emoji: validatedData.emoji || '📚',
                classCode,
                schoolId: session.user.schoolId,
                teacherId: session.user.id,
            },
        })

        return NextResponse.json({ class: newClass }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Create class error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
