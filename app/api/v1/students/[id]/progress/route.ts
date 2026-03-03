import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, apiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/students/:id/progress
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await verifyApiKey(request)
    if (!auth.valid) {
        return apiError(auth.error, auth.status)
    }

    const { schoolId } = auth
    const studentId = params.id

    try {
        const student = await prisma.user.findFirst({
            where: { id: studentId, schoolId, role: 'STUDENT' },
            include: { streakData: true }
        })

        if (!student) {
            return apiError('Student not found in this school', 404)
        }

        const gameResults = await prisma.gameResult.findMany({
            where: { studentId },
            orderBy: { completedAt: 'desc' },
            take: 50
        })

        return NextResponse.json({
            student: {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                email: student.email
            },
            stats: {
                totalGames: gameResults.length,
                totalXP: gameResults.reduce((sum, r) => sum + r.xpEarned, 0),
                currentStreak: student.streakData?.currentStreak || 0
            },
            recentGames: gameResults
        })
    } catch (error) {
        return apiError('Internal server error', 500)
    }
}
