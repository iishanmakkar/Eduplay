import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processRazorpayEvent } from '@/lib/webhooks/razorpay-handler'
import { createCronLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Cron Job: Webhook Dead Letter Queue Retry
 * Sweeps the WebhookEvent table for FAILED or stuck PROCESSING events.
 * Retries up to 5 times with exponential backoff.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('webhook-dlq-retry')
    log.start()

    try {
        const MAX_RETRIES = 5

        // Find events that failed OR have been stuck in PROCESSING for over 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

        const pendingEvents = await prisma.webhookEvent.findMany({
            where: {
                OR: [
                    { status: 'FAILED', retryCount: { lt: MAX_RETRIES } },
                    { status: 'PROCESSING', createdAt: { lt: fifteenMinutesAgo }, retryCount: { lt: MAX_RETRIES } }
                ]
            },
            take: 50, // Process in batches
            orderBy: { createdAt: 'asc' }
        })

        if (pendingEvents.length === 0) {
            log.success({ message: 'DLQ is clean. No events to retry.' })
            return NextResponse.json({ message: 'No pending DLQ events', processed: 0 })
        }

        let successCount = 0
        let failureCount = 0

        for (const eventRecord of pendingEvents) {
            try {
                // Update to processing state
                await prisma.webhookEvent.update({
                    where: { id: eventRecord.id },
                    data: { status: 'PROCESSING', retryCount: { increment: 1 } }
                })

                // Fire the core webhook logic
                await processRazorpayEvent(eventRecord.payload)

                // Mark successful
                await prisma.webhookEvent.update({
                    where: { id: eventRecord.id },
                    data: { status: 'SUCCESS', processedAt: new Date(), error: null }
                })
                successCount++

            } catch (error: any) {
                const newRetryCount = eventRecord.retryCount + 1
                const newStatus = newRetryCount >= MAX_RETRIES ? 'DEAD' : 'FAILED'

                // Mark failed or dead
                await prisma.webhookEvent.update({
                    where: { id: eventRecord.id },
                    data: {
                        status: newStatus,
                        error: `Retry ${newRetryCount} Failed: ${error.message || String(error)}`
                    }
                })
                failureCount++
            }
        }

        log.success({ processed: pendingEvents.length, successCount, failureCount })
        return NextResponse.json({
            message: 'DLQ sweep complete',
            total: pendingEvents.length,
            success: successCount,
            failed: failureCount
        })

    } catch (error) {
        log.error(error)
        return NextResponse.json({ error: 'DLQ sweep failed' }, { status: 500 })
    }
}
