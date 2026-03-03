import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prismaReadonly as prisma } from '@/lib/prisma'

/**
 * Production Access Audit Log API — SOC 2 CC7.2, CC6.3
 * OWNER only — returns paginated audit log entries for compliance reviews
 *
 * GET /api/admin/audit-log
 *   ?limit=50&cursor=<cuid>&action=LOGIN&userId=<id>&from=<ISO>&to=<ISO>
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized — OWNER role required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const cursor = searchParams.get('cursor') || undefined
    const action = searchParams.get('action') || undefined
    const userId = searchParams.get('userId') || undefined
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

    try {
        const where: any = {}
        if (action) where.action = action
        if (userId) where.userId = userId
        if (from || to) {
            where.createdAt = {}
            if (from) where.createdAt.gte = from
            if (to) where.createdAt.lte = to
        }

        const entries = await (prisma as any).auditLog?.findMany?.({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? {
                cursor: { id: cursor },
                skip: 1,
            } : {}),
            select: {
                id: true,
                userId: true,
                action: true,
                resource: true,
                resourceId: true,
                details: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
            }
        }) ?? []

        const hasNextPage = entries.length > limit
        const items = hasNextPage ? entries.slice(0, limit) : entries
        const nextCursor = hasNextPage ? items[items.length - 1]?.id : null

        // Summary stats for compliance dashboard
        const actionCounts: Record<string, number> = {}
        for (const entry of items) {
            actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1
        }

        return NextResponse.json({
            entries: items,
            pagination: {
                limit,
                hasNextPage,
                nextCursor,
                total: items.length,
            },
            summary: { actionCounts }
        })

    } catch (error: any) {
        // Graceful: AuditLog model may not exist yet (pre-migration)
        return NextResponse.json({
            entries: [],
            pagination: { limit, hasNextPage: false, nextCursor: null, total: 0 },
            note: 'AuditLog model not yet migrated or empty',
            error: error.message
        })
    }
}
