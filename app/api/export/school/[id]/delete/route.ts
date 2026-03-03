/**
 * FERPA / GDPR Right to be Forgotten — School Data Deletion API
 * DELETE /api/export/school/[id]/delete
 *
 * This endpoint permanently erases a School and all associated cascading records
 * (Users, Classes, Assignments, GameResults, etc.) to comply with the 45-day
 * mandatory deletion window under FERPA and GDPR Right to Erasure.
 *
 * Access control:
 * - SCHOOL role: can only delete their own school (schoolId match required)
 * - OWNER role: can delete any school
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Auth & Authorization ──────────────────────────────────────────────
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            logger.warn('Unauthorized deletion attempt', { schoolId: params.id })
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { role, schoolId: sessionSchoolId, id: userId } = session.user as any

        if (role !== 'SCHOOL' && role !== 'OWNER') {
            logger.warn('Forbidden deletion attempt: invalid role', { userId, role, targetSchoolId: params.id })
            return NextResponse.json({ error: 'Forbidden: requires SCHOOL or OWNER role' }, { status: 403 })
        }

        // SCHOOL restricted to their own ID
        if (role === 'SCHOOL' && sessionSchoolId !== params.id) {
            logger.warn('Forbidden deletion attempt: school mismatch', { userId, sessionSchoolId, targetSchoolId: params.id })
            return NextResponse.json({ error: 'Forbidden: school mismatch' }, { status: 403 })
        }

        // ── Execution ─────────────────────────────────────────────────────────
        logger.info('Initiating FERPA/GDPR Right to be Forgotten deletion', {
            targetSchoolId: params.id,
            requestedBy: userId,
            role
        })

        // Prisma handles the cascading deletes natively based on the schema onDelete: Cascade rules.
        // Deleting the School wipes all User (and thus GameResult, SkillMastery, AuditLog) records attached to it.
        await prisma.school.delete({
            where: { id: params.id }
        })

        logger.info('School deletion successful', { targetSchoolId: params.id })

        return NextResponse.json({
            success: true,
            message: 'School and all associated data permanently deleted in compliance with FERPA/GDPR.',
            deletedAt: new Date().toISOString(),
            schoolId: params.id
        })

    } catch (error: any) {
        // If the school doesn't exist, Prisma throws a P2025 error
        if (error.code === 'P2025') {
            logger.warn('Deletion failed: School not found', { targetSchoolId: params.id })
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        logger.error('Critical error during school deletion', {
            error: error.message,
            stack: error.stack,
            targetSchoolId: params.id
        })
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
