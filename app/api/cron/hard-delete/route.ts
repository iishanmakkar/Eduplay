import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'
import { createCronLogger } from '@/lib/logger'

// Only accessible via Vercel Cron or specific secure internal headers
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')

        // Ensure this is only triggered securely
        if (
            authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            !req.headers.get('x-vercel-cron')
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find users soft-deleted more than 30 days ago
        const thirtyDaysAgo = subDays(new Date(), 30)

        const usersToDelete = await prisma.user.findMany({
            where: {
                deletedAt: { lte: thirtyDaysAgo }
            },
            select: { id: true, analyticsId: true }
        })

        if (usersToDelete.length === 0) {
            return NextResponse.json({ message: 'No accounts pending hard deletion' })
        }

        const userIds = usersToDelete.map(u => u.id)

        // The analytics IDs won't be deleted, as we explicitly decoupled them during the
        // soft-delete phase. The game telemetry remains forever, completely anonymized.

        // Perform hard deletion
        // Note: Casade deletes in Prisma will clean up GameResults (if any remained attached)
        // and other orphaned relations.
        const deleteResult = await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        })

        // Log the batch deletion action securely
        const { logAudit } = await import('@/lib/audit/log')
        await logAudit({
            userId: 'SYSTEM',
            action: 'CRON_HARD_DELETE',
            resource: 'USER_BATCH',
            resourceId: 'BATCH',
            details: { count: deleteResult.count }
        })

        return NextResponse.json({
            success: true,
            deletedCount: deleteResult.count
        })
    } catch (error) {
        console.error('Hard Deletion Cron Error:', error)
        return NextResponse.json({ error: 'Failed to process hard deletion' }, { status: 500 })
    }
}
