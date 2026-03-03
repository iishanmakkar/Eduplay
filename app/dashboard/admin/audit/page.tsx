import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AuditLogViewer from '@/components/AuditLogViewer'

export default async function AuditLogPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'SCHOOL' && session.user.role !== 'OWNER')) {
        redirect('/auth/signin')
    }

    const logs = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    firstName: true,
                    email: true,
                },
            },
        },
    })

    // Serialize dates for client component
    const serializedLogs = logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        details: log.details as any,
        user: {
            ...log.user,
            firstName: log.user.firstName || 'System'
        }
    }))

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold text-ink">Security Audit Logs</h1>
                <p className="text-mist">Track user activity and system events.</p>
            </div>

            <AuditLogViewer logs={serializedLogs} />
        </div>
    )
}
