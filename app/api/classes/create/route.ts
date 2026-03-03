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

        const { name, grade, subject, emoji } = await request.json()

        if (!name || !grade) {
            return NextResponse.json(
                { error: 'Name and grade are required' },
                { status: 400 }
            )
        }

        // Check class limits
        const { checkLimit } = await import('@/lib/limits/check')
        const limitCheck = await checkLimit(session.user.schoolId, 'classes')

        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: `Class limit reached for ${limitCheck.plan} plan. Upgrade to create more.` },
                { status: 403 }
            )
        }

        // Generate unique class code
        const classCode = Math.random().toString(36).substring(2, 8).toUpperCase()

        const newClass = await prisma.class.create({
            data: {
                name,
                grade,
                subject: subject || null,
                emoji: emoji || '📚',
                classCode,
                teacherId: session.user.id,
                schoolId: session.user.schoolId,
            },
        })

        const { logAudit } = await import('@/lib/audit/log')
        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            resource: 'CLASS',
            resourceId: newClass.id,
            details: { name: newClass.name, grade: newClass.grade }
        })

        return NextResponse.json({
            success: true,
            class: newClass,
        })
    } catch (error) {
        console.error('Create class error:', error)
        return NextResponse.json(
            { error: 'Failed to create class' },
            { status: 500 }
        )
    }
}
