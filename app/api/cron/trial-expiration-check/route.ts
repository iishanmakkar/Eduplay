import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTrialExpiryWarning } from '@/lib/email'
import { createCronLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const log = createCronLogger('trial-expiration-check')
    log.start()
    try {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        // Get all trialing subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'TRIALING',
            },
            include: {
                school: {
                    include: {
                        users: {
                            where: { role: 'SCHOOL' },
                            take: 1,
                        },
                    },
                },
            },
        })

        let sentCount = 0

        for (const subscription of subscriptions) {
            const trialStart = subscription.trialStartedAt || subscription.createdAt
            const trialEnd = new Date(trialStart)
            trialEnd.setDate(trialEnd.getDate() + 30)

            const daysLeft = Math.ceil(
                (trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Send reminders at 7, 3, and 1 days left
            if ([7, 3, 1].includes(daysLeft)) {
                const admin = subscription.school.users[0]
                if (!admin || !admin.email) continue

                // Check if we've already sent this reminder
                const existingLog = await prisma.emailLog.findFirst({
                    where: {
                        userId: admin.id,
                        type: 'TRIAL_EXPIRY',
                        sentAt: {
                            gte: today,
                        },
                    },
                })

                if (existingLog) continue

                // Send reminder
                const result = await sendTrialExpiryWarning({
                    email: admin.email,
                    firstName: admin.firstName || 'Administrator'
                }, daysLeft)

                if (result.success) {
                    await prisma.emailLog.create({
                        data: {
                            userId: admin.id,
                            type: 'TRIAL_EXPIRY',
                            subject: `⏰ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left in your trial`,
                        },
                    })
                    sentCount++
                }
            }

            // Auto-expire trials that are past due
            if (daysLeft <= 0 && subscription.status === 'TRIALING') {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'CANCELED' },
                })
            }
        }

        log.success({ sentCount, subscriptionsChecked: subscriptions.length })
        return NextResponse.json({
            message: `Processed ${subscriptions.length} trials, sent ${sentCount} reminders`,
        })
    } catch (error) {
        log.error(error)
        return NextResponse.json({ error: 'Failed to check trials' }, { status: 500 })
    }
}
