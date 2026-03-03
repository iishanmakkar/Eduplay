import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, gameType, dueDate, classId } = await request.json()

        if (!title || !gameType || !dueDate || !classId) {
            return NextResponse.json(
                { error: 'Title, game type, due date, and class are required' },
                { status: 400 }
            )
        }

        // Verify teacher owns this class
        const classData = await prisma.class.findUnique({
            where: { id: classId },
        })

        if (!classData || classData.teacherId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                gameType,
                dueDate: new Date(dueDate),
                classId,
                teacherId: session.user.id,
            },
        })

        const { logAudit } = await import('@/lib/audit/log')
        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            resource: 'ASSIGNMENT',
            resourceId: assignment.id,
            details: { title: assignment.title, classId: assignment.classId }
        })

        return NextResponse.json({
            success: true,
            assignment,
        })
    } catch (error) {
        console.error('Create assignment error:', error)
        return NextResponse.json(
            { error: 'Failed to create assignment' },
            { status: 500 }
        )
    }
}
