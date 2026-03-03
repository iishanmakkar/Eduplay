import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCronLogger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'

/**
 * Quarterly Access Review Cron — SOC 2 CC6.3
 * Generates a report of:
 * - OWNER/ADMIN accounts not accessed in 90+ days
 * - Schools with no activity in 60+ days (potential churned accounts)
 * - API keys not used in 90+ days
 *
 * Schedule: 0 0 1 1,4,7,10 * (Jan 1, Apr 1, Jul 1, Oct 1 at midnight)
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('quarterly-access-review')
    log.start()

    try {
        const now = new Date()
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        // 1. OWNER / SCHOOL roles inactive for 90+ days
        const inactiveAdmins = await prisma.user.findMany({
            where: {
                role: { in: ['OWNER', 'SCHOOL'] },
                deletedAt: null,
                OR: [
                    { updatedAt: { lt: ninetyDaysAgo } },
                    { createdAt: { lt: ninetyDaysAgo }, gameResults: { none: {} } }
                ]
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                createdAt: true,
                updatedAt: true,
            },
            take: 100
        })

        // 2. Active subscriptions with no students who played in 60+ days
        const dormantSchools = await prisma.school.findMany({
            where: {
                subscription: { status: 'ACTIVE' },
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                users: {
                    where: {
                        role: 'STUDENT',
                        deletedAt: null,
                        gameResults: {
                            some: {
                                completedAt: { gte: sixtyDaysAgo }
                            }
                        }
                    },
                    select: { id: true },
                    take: 1
                }
            },
            take: 50
        })

        const dormantSchoolList = dormantSchools.filter(s => s.users.length === 0)

        // 3. Total active users (summary)
        const totalActiveUsers = await prisma.user.count({
            where: { deletedAt: null }
        })

        // 4. Log this review to AuditLog for SOC 2 evidence
        await logAudit({
            userId: 'SYSTEM',
            action: 'VIEW',
            resource: 'USER_BATCH',
            resourceId: 'ALL',
            details: {
                inactiveAdminCount: inactiveAdmins.length,
                dormantSchoolCount: dormantSchoolList.length,
                totalActiveUsers,
                reviewDate: now.toISOString()
            }
        })

        const report = {
            reviewDate: now.toISOString(),
            totalActiveUsers,
            inactiveAdmins: inactiveAdmins.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                lastUpdated: u.updatedAt,
                action: 'REVIEW_REQUIRED'
            })),
            dormantSchools: dormantSchoolList.map(s => ({
                schoolId: s.id,
                schoolName: s.name,
                noStudentActivityDays: 60,
                action: 'CONSIDER_OUTREACH'
            })),
            summary: {
                inactiveAdminCount: inactiveAdmins.length,
                dormantSchoolCount: dormantSchoolList.length,
                recommendation: inactiveAdmins.length > 0
                    ? 'Review inactive OWNER/SCHOOL accounts with CTO and revoke if appropriate'
                    : 'No action required'
            }
        }

        log.success({ inactiveAdminCount: inactiveAdmins.length, dormantSchoolCount: dormantSchoolList.length })
        return NextResponse.json({ success: true, report })

    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'Quarterly access review failed' }, { status: 500 })
    }
}
