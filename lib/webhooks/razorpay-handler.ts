import { prisma } from '@/lib/prisma'

/**
 * Shared logic to process Razorpay webhook events.
 * Extracted so it can be called seamlessly by both the live webhook Endpoint
 * and the asynchronous Dead Letter Queue (DLQ) retry cron job.
 */
export async function processRazorpayEvent(event: any) {
    switch (event.event) {
        case 'subscription.activated': {
            const subscription = event.payload.subscription.entity

            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id, // Reusing Stripe field for Razorpay
                },
                data: {
                    status: 'ACTIVE',
                    currentPeriodEnd: new Date(subscription.current_end * 1000),
                },
            })
            break
        }

        case 'subscription.charged': {
            const payment = event.payload.payment.entity
            const subscription = event.payload.subscription.entity

            // Update subscription status and log transaction
            const dbSubscription = await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    status: 'ACTIVE',
                    currentPeriodEnd: new Date(subscription.current_end * 1000),
                },
            })

            // Log the payment transaction
            await prisma.paymentTransaction.create({
                data: {
                    amount: payment.amount,
                    currencyCode: payment.currency,
                    status: 'success',
                    razorpayPaymentId: payment.id,
                    razorpayOrderId: payment.order_id,
                    subscriptionId: dbSubscription.id,
                    description: `Subscription renewal (${subscription.plan_id})`
                }
            })
            break
        }

        case 'subscription.cancelled': {
            const subscription = event.payload.subscription.entity

            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    status: 'CANCELED',
                    cancelAtPeriodEnd: true,
                },
            })
            break
        }

        case 'subscription.paused':
        case 'subscription.halted': {
            const subscription = event.payload.subscription.entity

            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    status: 'PAST_DUE',
                },
            })
            break
        }

        case 'subscription.completed': {
            const subscription = event.payload.subscription.entity

            await prisma.subscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    status: 'CANCELED',
                },
            })
            break
        }

        default:
            console.log(`Unhandled Razorpay event: ${event.event}`)
    }
}
