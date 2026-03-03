import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpay, PLANS } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'SCHOOL' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { plan } = await request.json()

        if (!['STARTER', 'SCHOOL', 'DISTRICT'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const planConfig = PLANS[plan as keyof typeof PLANS]

        // Get or create Razorpay customer
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { school: { include: { subscription: true } } },
        })

        if (!user || !user.school) {
            return NextResponse.json({ error: 'User or school not found' }, { status: 404 })
        }

        let customerId = user.school.subscription?.stripeCustomerId // Reusing field for Razorpay customer ID

        // Create Razorpay customer if doesn't exist
        if (!customerId) {
            const customer = await razorpay.customers.create({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                contact: '', // Add phone if available
                notes: {
                    schoolId: user.schoolId,
                    userId: user.id,
                },
            })
            customerId = customer.id
        }

        // Create Razorpay subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: planConfig.planId,
            customer_notify: 1,
            quantity: 1,
            total_count: 12, // 12 months
            notes: {
                schoolId: user.schoolId,
                plan: plan,
            },
        })

        // Update database
        await prisma.subscription.upsert({
            where: { schoolId: user.school.id },
            update: {
                plan: plan as any,
                status: 'TRIALING',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
            },
            create: {
                schoolId: user.school.id,
                plan: plan as any,
                status: 'TRIALING',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
            },
        })

        return NextResponse.json({
            subscriptionId: subscription.id,
            customerId: customerId,
            shortUrl: subscription.short_url,
        })
    } catch (error: any) {
        console.error('Create subscription error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create subscription' },
            { status: 500 }
        )
    }
}
