import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import {
    sendPaymentSuccessEmail,
    sendCancellationConfirmationEmail,
    sendPaymentFailedEmail,
} from '@/lib/emails/templates'

/**
 * Razorpay Webhook Handler — with Idempotency + Dead-Letter Queue
 *
 * Every webhook event is recorded in WebhookEvent before processing.
 * If the same razorpayEventId arrives again (Razorpay retry), we return 200
 * immediately without re-processing — preventing double charges.
 *
 * DLQ flow:
 *   attempt 1 fails → retryCount = 1, status = FAILED
 *   attempt 2 fails → retryCount = 2, status = FAILED
 *   attempt 3 fails → retryCount = 3, status = DEAD  (parked, needs manual review)
 */
export async function POST(req: NextRequest) {
    let webhookRecord: { id: string } | null = null

    try {
        // ── 1. Verify webhook signature ──────────────────────────────────────
        const signature = req.headers.get('x-razorpay-signature')
        const body = await req.text()

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 })
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest('hex')

        if (signature !== expectedSignature) {
            console.error('[webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // ── 2. Parse event ───────────────────────────────────────────────────
        const event = JSON.parse(body)
        const razorpayEventId: string = event.id ?? `unknown_${Date.now()}`
        const eventType: string = event.event ?? 'unknown'

        console.log(`[webhook] Received event=${eventType} id=${razorpayEventId}`)

        // ── 3. Idempotency check — upsert WebhookEvent ───────────────────────
        const existing = await prisma.webhookEvent.findUnique({
            where: { razorpayEventId },
        })

        if (existing) {
            if (existing.status === 'SUCCESS') {
                // Already processed successfully — idempotent 200
                console.log(`[webhook] Duplicate event ${razorpayEventId} — skipping (already SUCCESS)`)
                return NextResponse.json({ received: true, idempotent: true })
            }
            if (existing.status === 'DEAD') {
                // Parked in DLQ — return 200 so Razorpay stops retrying, alert separately
                console.error(`[webhook][DLQ] Dead event ${razorpayEventId} received again — ignoring`)
                return NextResponse.json({ received: true, dead: true })
            }
            // FAILED or PROCESSING → will attempt again
            webhookRecord = existing
            await prisma.webhookEvent.update({
                where: { id: existing.id },
                data: { status: 'PROCESSING', updatedAt: new Date() },
            })
        } else {
            // First delivery — create the record
            webhookRecord = await prisma.webhookEvent.create({
                data: {
                    razorpayEventId,
                    eventType,
                    status: 'PROCESSING',
                    payload: event,
                },
            })
        }

        // ── 4. Process event ─────────────────────────────────────────────────
        switch (eventType) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity)
                break
            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity)
                break
            case 'subscription.activated':
                await handleSubscriptionActivated(event.payload.subscription.entity)
                break
            case 'subscription.charged':
                await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity)
                break
            case 'subscription.cancelled':
                await handleSubscriptionCancelled(event.payload.subscription.entity)
                break
            case 'subscription.paused':
                await handleSubscriptionPaused(event.payload.subscription.entity)
                break
            case 'subscription.resumed':
                await handleSubscriptionResumed(event.payload.subscription.entity)
                break
            default:
                console.log(`[webhook] Unhandled event type: ${eventType}`)
        }

        // ── 5. Mark as SUCCESS ────────────────────────────────────────────────
        if (webhookRecord) {
            await prisma.webhookEvent.update({
                where: { id: webhookRecord.id },
                data: { status: 'SUCCESS', processedAt: new Date() },
            })
        }

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('[webhook] Processing error:', error)

        // ── DLQ logic: escalate on repeated failures ──────────────────────────
        if (webhookRecord) {
            try {
                const current = await prisma.webhookEvent.findUnique({
                    where: { id: webhookRecord.id },
                })
                const newRetryCount = (current?.retryCount ?? 0) + 1
                const isDead = newRetryCount >= 3

                await prisma.webhookEvent.update({
                    where: { id: webhookRecord.id },
                    data: {
                        status: isDead ? 'DEAD' : 'FAILED',
                        retryCount: newRetryCount,
                        error: error?.message ?? 'Unknown error',
                    },
                })

                if (isDead) {
                    console.error(
                        `[webhook][DLQ] Event ${webhookRecord.id} permanently failed after ` +
                        `${newRetryCount} attempts. Parked in dead-letter queue.`
                    )
                }
            } catch (dlqErr) {
                console.error('[webhook][DLQ] Failed to update DLQ record:', dlqErr)
            }
        }

        return NextResponse.json(
            { error: error.message || 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

// ── Event handlers (unchanged logic, isolated for clarity) ────────────────────

interface RazorpayPayment {
    id: string
    amount: number
    currency: string
    error_description?: string
}

interface RazorpaySubscription {
    id: string
    current_start: number
    current_end: number
}

async function handlePaymentCaptured(payment: RazorpayPayment) {
    const transaction = await prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: payment.id },
        include: { subscription: { include: { school: { include: { users: true } } } } },
    })
    if (transaction?.subscription) {
        const admin = transaction.subscription.school.users.find((u: any) => u.role === 'SCHOOL')
        if (admin) {
            await sendPaymentSuccessEmail(
                admin.email ?? '',
                admin.firstName ?? 'Admin',
                transaction.subscription.plan,
                `${payment.amount / 100} ${payment.currency}`
            )
        }
    }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
    await prisma.paymentTransaction.updateMany({
        where: { razorpayPaymentId: payment.id },
        data: { status: 'failed', description: payment.error_description || 'Payment failed' },
    })
    const transaction = await prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: payment.id },
        include: { subscription: { include: { school: { include: { users: true } } } } },
    })
    if (transaction?.subscription) {
        await prisma.subscription.update({
            where: { id: transaction.subscription.id },
            data: { status: 'PAST_DUE' },
        })
        const admin = transaction.subscription.school.users.find((u: any) => u.role === 'SCHOOL')
        if (admin) {
            await sendPaymentFailedEmail(admin.email ?? '', admin.firstName ?? 'Admin', transaction.subscription.plan)
        }
    }
}

async function handleSubscriptionActivated(subscription: RazorpaySubscription) {
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: subscription.id } })
    if (sub) {
        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(subscription.current_start * 1000),
                currentPeriodEnd: new Date(subscription.current_end * 1000),
            },
        })
    }
}

async function handleSubscriptionCharged(subscription: RazorpaySubscription, payment: RazorpayPayment) {
    const sub = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
        include: { school: { include: { users: true } } },
    })
    if (sub) {
        const admin = sub.school.users.find((u: any) => u.role === 'SCHOOL')
        if (admin) {
            await sendPaymentSuccessEmail(
                admin.email ?? '',
                admin.firstName ?? 'Admin',
                sub.plan,
                `${payment.amount / 100} ${payment.currency}`
            )
        }
    }
}

async function handleSubscriptionCancelled(subscription: RazorpaySubscription) {
    const sub = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscription.id },
        include: { school: { include: { users: true } } },
    })
    if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED', cancelledAt: new Date() } })
        const admin = sub.school.users.find((u: any) => u.role === 'SCHOOL')
        if (admin) await sendCancellationConfirmationEmail(admin.email ?? '', admin.firstName ?? 'Admin')
    }
}

async function handleSubscriptionPaused(subscription: RazorpaySubscription) {
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: subscription.id } })
    if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } })
}

async function handleSubscriptionResumed(subscription: RazorpaySubscription) {
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: subscription.id } })
    if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } })
}
