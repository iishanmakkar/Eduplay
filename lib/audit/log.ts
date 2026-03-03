
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'CONSENT_REQUESTED' | 'CONSENT_GRANTED' | 'COPPA_DOB_SUBMITTED' | 'DATA_DELETION_REQUESTED' | 'CRON_HARD_DELETE' | 'DATA_EXPORT_DOWNLOADED'
export type AuditResource = 'CLASS' | 'ASSIGNMENT' | 'USER' | 'SUBSCRIPTION' | 'GAME' | 'SYSTEM' | 'CONSENT' | 'USER_BATCH' | 'USER_EXPORT'

interface AuditLogOptions {
    action: AuditAction
    resource: AuditResource
    resourceId?: string
    details?: Record<string, any>
    userId: string
}

export async function logAudit({ action, resource, resourceId, details, userId }: AuditLogOptions) {
    try {
        const headersList = headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                details: details ? JSON.stringify(details) : undefined,
                ipAddress: ip,
                userAgent,
            },
        })
    } catch (error) {
        // Fail silently to not block the main action, but log to console
        console.error('Audit logging failed:', error)
    }
}
