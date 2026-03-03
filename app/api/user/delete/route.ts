import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // 1. Fetch user to identify their analytics ID for decoupling
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { analyticsId: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 2. Log the deletion request
        const { logAudit } = await import('@/lib/audit/log')
        await logAudit({
            userId: userId,
            action: 'DATA_DELETION_REQUESTED',
            resource: 'USER',
            resourceId: userId,
            details: { role: user.role }
        })

        // 3. Obfuscate PII immediately (GDPR Right to Erasure)
        // We set deletedAt to start the 30-day clock for hard deletion of the row, 
        // but the PII is gone natively from this moment forward.
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: 'Deleted',
                lastName: 'User',
                name: 'Deleted User',
                email: `deleted-${userId}@eduplay.dev`,
                image: null,
                googleId: null,
                dob: null,
                parentEmail: null,
                deletedAt: new Date()
            }
        })

        // 4. Decouple Analytics
        // The GameResults remain for global training sets, but they are now
        // completely orphaned from the original user identity.
        if (user.analyticsId) {
            await prisma.userAnalytics.update({
                where: { id: user.analyticsId },
                data: { pseudonym: 'Anonymous Learner' }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Account scheduled for deletion. PII has been obfuscated.'
        })
    } catch (error) {
        console.error('Data Deletion Error:', error)
        return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 })
    }
}
