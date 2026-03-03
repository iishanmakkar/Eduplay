import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = headers().get('x-razorpay-signature')!

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)) {
        console.error('Invalid Razorpay webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        const event = JSON.parse(body)
        const eventId = event.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 1. Idempotency: skip if already successfully processed
        const existingEvent = await prisma.webhookEvent.findUnique({
            where: { razorpayEventId: eventId }
        })

        if (existingEvent && existingEvent.status === 'SUCCESS') {
            return NextResponse.json({ received: true, message: 'Already processed' })
        }

        // 2. Dead Letter Queue Init: Create or update to PROCESSING
        const webhookRecord = await prisma.webhookEvent.upsert({
            where: { razorpayEventId: eventId },
            update: { status: 'PROCESSING', payload: event, error: null },
            create: { razorpayEventId: eventId, eventType: event.event || 'unknown', payload: event, status: 'PROCESSING' }
        })

        try {
            // 3. Process the event payload
            const { processRazorpayEvent } = await import('@/lib/webhooks/razorpay-handler')
            await processRazorpayEvent(event)

            // 4. Verification: Mark as SUCCESS
            await prisma.webhookEvent.update({
                where: { id: webhookRecord.id },
                data: { status: 'SUCCESS', processedAt: new Date() }
            })

            return NextResponse.json({ received: true })
        } catch (processingError: any) {
            // 5. DLQ Push: Mark as FAILED for cron retries
            await prisma.webhookEvent.update({
                where: { id: webhookRecord.id },
                data: { status: 'FAILED', error: processingError.message || String(processingError) }
            })

            // Re-throw so Razorpay continues its native retry backoff alongside our DB DLQ
            throw processingError
        }
    } catch (error) {
        console.error('Razorpay webhook handler error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}
