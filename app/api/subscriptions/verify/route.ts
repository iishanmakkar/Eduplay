import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPaymentSuccessEmail } from '@/lib/emails/templates'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = await req.json()

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex')

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            )
        }

        // Get user's school
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { school: { include: { subscription: true } } },
        })

        if (!user?.school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // Get order details from Razorpay (to get plan info from notes)
        const Razorpay = require('razorpay')
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })

        const order = await razorpay.orders.fetch(razorpay_order_id)
        const { plan, billingCycle } = order.notes

        // Calculate period dates
        const now = new Date()
        const periodEnd = new Date(now)
        if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        // Update or create subscription
        const subscription = await prisma.subscription.upsert({
            where: { schoolId: user.school.id },
            create: {
                schoolId: user.school.id,
                plan,
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                trialEndsAt: null,
            },
            update: {
                plan,
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                trialEndsAt: null,
                cancelAtPeriodEnd: false,
                cancelledAt: null,
            },
        })

        // Create transaction record
        await prisma.paymentTransaction.create({
            data: {
                subscriptionId: subscription.id,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                amount: order.amount,
                currencyCode: order.currency,
                status: 'success',

                description: `${plan} - ${billingCycle}`,
            },
        })

        // Send payment success email
        await sendPaymentSuccessEmail(
            user.email,
            user.firstName || 'Admin',
            plan,
            `${order.amount / 100} ${order.currency}`
        )

        return NextResponse.json({
            success: true,
            subscription: {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
        })
    } catch (error: any) {
        console.error('Payment verification error:', error)
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        )
    }
}
