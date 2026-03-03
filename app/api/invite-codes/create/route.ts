import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const createSchema = z.object({
    classId: z.string().optional(),
    usageLimit: z.number().min(1).max(200).default(30),
    expiresInDays: z.number().min(1).max(90).default(7),
})

// POST /api/invite-codes/create
// Teachers create invite codes for their classes
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only TEACHER role can create invite codes
        if (session.user.role !== 'TEACHER') {
            return NextResponse.json(
                { error: 'Only teachers can create invite codes' },
                { status: 403 }
            )
        }

        const teacherId = session.user.id
        const schoolId = session.user.schoolId

        if (!schoolId) {
            return NextResponse.json(
                { error: 'Teacher must be associated with a school' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { classId, usageLimit, expiresInDays } = createSchema.parse(body)

        // If classId provided, verify it belongs to this teacher's school
        if (classId) {
            const cls = await prisma.class.findUnique({
                where: { id: classId },
                select: { schoolId: true, teacherId: true },
            })

            if (!cls) {
                return NextResponse.json({ error: 'Class not found' }, { status: 404 })
            }

            if (cls.schoolId !== schoolId) {
                return NextResponse.json(
                    { error: 'Class does not belong to your school' },
                    { status: 403 }
                )
            }

            if (cls.teacherId !== teacherId) {
                return NextResponse.json(
                    { error: 'You can only create invite codes for your own classes' },
                    { status: 403 }
                )
            }
        }

        // Generate cryptographically random 8-char code (brute-force resistant)
        const code = crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F8B2C1"

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        const inviteCode = await prisma.inviteCode.create({
            data: {
                code,
                schoolId,
                teacherId,
                classId: classId || null,
                expiresAt,
                usageLimit,
            },
        })

        return NextResponse.json({
            code: inviteCode.code,
            expiresAt: inviteCode.expiresAt,
            usageLimit: inviteCode.usageLimit,
            classId: inviteCode.classId,
        }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
        }
        console.error('Create invite code error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET /api/invite-codes/create — list teacher's active invite codes
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const codes = await prisma.inviteCode.findMany({
            where: {
                teacherId: session.user.id,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: {
                class: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ codes })
    } catch (error) {
        console.error('List invite codes error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
