import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, apiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const auth = await verifyApiKey(req)
    if ('error' in auth) {
        return apiError(auth.error, auth.status as number)
    }

    const { schoolId } = auth

    const stats = await prisma.$transaction([
        prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.gameResult.aggregate({
            _sum: { score: true },
            where: { student: { schoolId } }
        }),
        prisma.gameResult.count({
            where: { student: { schoolId } }
        })
    ])

    return NextResponse.json({
        schoolId,
        studentCount: stats[0],
        classCount: stats[1],
        totalScore: stats[2]._sum.score || 0,
        totalGamesPlayed: stats[3],
        timestamp: new Date().toISOString()
    })
}
