import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Note: In a true enterprise environment, this would trigger a BullMQ job that
// uploads the zip to S3 and emails a presigned link. For NextJS Serverless, 
// we will stream it directly or return a JSON payload if too large.
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Fetch all Data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                badges: true,
                streakData: true,
                independentSubscription: true,
                auditLogs: { orderBy: { createdAt: 'desc' }, take: 100 }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const gameResults = await prisma.gameResult.findMany({
            where: { studentId: userId },
            orderBy: { completedAt: 'desc' },
            take: 1000 // Limit for serverless execution
        })

        const exportData = {
            personalInformation: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                dateOfBirth: user.dob,
                parentEmail: user.parentEmail,
                consentStatus: user.consentStatus,
                role: user.role,
                createdAt: user.createdAt,
            },
            gamification: {
                totalXp: user.xp,
                level: user.level,
                badges: user.badges,
                streaks: user.streakData
            },
            subscription: user.independentSubscription,
            gameHistory: gameResults,
            recentAuditLogs: user.auditLogs
        }

        // Log the export action
        const { logAudit } = await import('@/lib/audit/log')
        await logAudit({
            userId: userId,
            action: 'DATA_EXPORT_DOWNLOADED',
            resource: 'USER_EXPORT',
            resourceId: userId,
            details: { recordCount: gameResults.length }
        })

        // Return as deeply serialized JSON for now (Vercel serverless has low memory limits for streaming ZIP buffers)
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="eduplay-data-export-${userId}.json"`
            }
        })
    } catch (error) {
        console.error('Data Export Error:', error)
        return NextResponse.json({ error: 'Failed to generate data export' }, { status: 500 })
    }
}
