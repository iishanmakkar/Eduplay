import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTrialEndingEmail } from '@/lib/emails/send'
import { createCronLogger } from '@/lib/logger'

/**
 * Cron job to send trial reminder emails
 * Should run daily at midnight
 * Checks for trials ending in 3, 2, or 1 days
 */
export async function GET(req: NextRequest) {
    const log = createCronLogger('send-trial-reminders')
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        log.start()

        const now = new Date()
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

        // Find subscriptions with trials ending soon
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'TRIALING',
                trialEndsAt: {
                    gte: now,
                    lte: threeDaysFromNow,
                },
            },
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

        let emailsSent = 0

        for (const subscription of subscriptions) {
            const admin = subscription.school.users[0]
            if (!admin || !subscription.trialEndsAt) continue

            const daysLeft = Math.ceil(
                (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Only send on specific days (3, 2, 1)
            if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
                try {
                    await sendTrialEndingEmail(
                        admin.email,
                        admin.firstName || 'Administrator',
                        subscription.school.name,
                        daysLeft,
                        subscription.plan as string
                    )
                    emailsSent++

                    // Log email
                    await prisma.emailLog.create({
                        data: {
                            userId: admin.id,
                            type: 'trial_reminder',
                            status: 'sent',
                            subject: `Trial ends in ${daysLeft} days`
                        },
                    })
                } catch (error) {
                    console.error('Failed to send trial reminder:', error)

                    await prisma.emailLog.create({
                        data: {
                            userId: admin.id,
                            type: 'trial_reminder',
                            status: 'failed',
                            subject: `Failed: Trial ends in ${daysLeft} days`,
                            // error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    })
                }
            }
        }

        log.success({ emailsSent, subscriptionsChecked: subscriptions.length })
        return NextResponse.json({ success: true, emailsSent, subscriptionsChecked: subscriptions.length })
    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 })
    }
}
