import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTrialExpiredEmail } from '@/lib/emails/templates'
import { createCronLogger } from '@/lib/logger'

/**
 * Cron job to check and handle trial expirations
 * Should run daily at midnight
 * Downgrades expired trials to free tier or locks features
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()

        // Find expired trials
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'TRIALING',
                trialEndsAt: {
                    lte: now,
                },
            } as any,
            include: {
                school: {
                    include: {
                        users: {
                            where: { role: 'SCHOOL' },
                        },
                    },
                },
            },
        })

        let subscriptionsUpdated = 0
        let emailsSent = 0

        for (const subscription of expiredSubscriptions) {
            await (prisma.subscription.update as any)({
                where: { id: subscription.id },
                data: {
                    status: 'CANCELED',
                    cancelledAt: now,
                },
            })

            subscriptionsUpdated++

            const admin = subscription.school.users[0]

            if (admin && admin.email) {
                try {
                    await sendTrialExpiredEmail(
                        admin.email,
                        admin.firstName || 'Administrator'
                    )

                    emailsSent++

                    await (prisma.emailLog.create as any)({
                        data: {
                            userId: admin.id,
                            type: 'trial_expired',
                            subject: 'Your trial has expired',
                            status: 'SENT',
                        },
                    })
                } catch (error) {
                    console.error('Failed to send trial expired email:', error)

                    await (prisma.emailLog.create as any)({
                        data: {
                            userId: admin.id,
                            type: 'trial_expired',
                            subject: 'Trial expiration email failed',
                            status: 'FAILED',
                        },
                    })
                }
            }
        }

        return NextResponse.json({
            success: true,
            subscriptionsUpdated,
            emailsSent,
        })
    } catch (error: any) {
        console.error('Trial expiration cron error:', error)
        return NextResponse.json(
            { error: error.message || 'Cron job failed' },
            { status: 500 }
        )
    }
}
