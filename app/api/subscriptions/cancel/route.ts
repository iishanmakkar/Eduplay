import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCancellationConfirmationEmail } from '@/lib/emails/templates'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { immediate } = await req.json()

        // Get user's school
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                school: {
                    include: { subscription: true },
                },
            },
        })

        if (!user?.school?.subscription) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
        }

        const subscription = user.school.subscription

        if (immediate) {
            // Cancel immediately
            await (prisma.subscription.update as any)({
                where: { id: subscription.id },
                data: {
                    status: 'CANCELED',
                    cancelledAt: new Date(),
                    currentPeriodEnd: new Date(),
                },
            })

            if ((subscription as any).razorpaySubscriptionId) {
                const Razorpay = require('razorpay')
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID!,
                    key_secret: process.env.RAZORPAY_KEY_SECRET!,
                })

                try {
                    await razorpay.subscriptions.cancel((subscription as any).razorpaySubscriptionId, true)
                } catch (error) {
                    console.error('Failed to cancel Razorpay subscription:', error)
                }
            }

            // Send confirmation email
            await sendCancellationConfirmationEmail(session.user.email!, session.user.firstName || 'Admin')

            return NextResponse.json({
                success: true,
                message: 'Subscription cancelled immediately',
            })
        } else {
            // Cancel at period end
            await (prisma.subscription.update as any)({
                where: { id: subscription.id },
                data: {
                    cancelAtPeriodEnd: true,
                },
            })

            return NextResponse.json({
                success: true,
                message: 'Subscription will cancel at the end of the billing period',
                endsAt: subscription.currentPeriodEnd,
            })
        }
    } catch (error: any) {
        console.error('Cancel subscription error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to cancel subscription' },
            { status: 500 }
        )
    }
}
