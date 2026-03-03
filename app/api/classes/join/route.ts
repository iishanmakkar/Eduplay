import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const joinClassSchema = z.object({
    classCode: z.string().length(6),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { classCode } = joinClassSchema.parse(body)

        if (!classCode) {
            return NextResponse.json({ error: 'Class code is required' }, { status: 400 })
        }

        // Find class
        const classToJoin = await prisma.class.findUnique({
            where: { classCode: classCode.toUpperCase() },
        })

        if (!classToJoin) {
            return NextResponse.json({ error: 'Invalid class code' }, { status: 404 })
        }

        // Check student limits for the school
        const { checkLimit } = await import('@/lib/limits/check')
        const limitCheck = await checkLimit(classToJoin.schoolId, 'students')

        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: `School student limit reached for ${limitCheck.plan} plan. School admin needs to upgrade.` },
                { status: 403 }
            )
        }

        // Check if already joinednrolled
        const existingEnrollment = await prisma.classStudent.findUnique({
            where: {
                classId_studentId: {
                    classId: classToJoin.id,
                    studentId: session.user.id,
                },
            },
        })

        if (existingEnrollment) {
            return NextResponse.json(
                { error: 'Already enrolled in this class' },
                { status: 400 }
            )
        }

        // Enroll student
        await prisma.classStudent.create({
            data: {
                classId: classToJoin.id,
                studentId: session.user.id,
            },
        })

        return NextResponse.json(
            { message: 'Successfully joined class', class: classToJoin },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid class code' },
                { status: 400 }
            )
        }

        console.error('Join class error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
