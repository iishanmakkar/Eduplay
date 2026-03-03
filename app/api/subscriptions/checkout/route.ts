import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

import { getBillingDetails } from '@/lib/billing/gateway'
import { SubscriptionPlan } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admins can manage subscriptions
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only admins can manage subscriptions' }, { status: 403 })
        }

        const { plan, billingCycle } = await req.json()

        if (!plan || !['STARTER', 'SCHOOL', 'DISTRICT'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
            return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
        }

        // Get user's school + subscription (for per-seat pricing)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                school: {
                    include: { subscription: { select: { pricePerSeat: true, seats: true } as any } }
                }
            },
        })

        if (!user?.school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // Count active billable students for per-seat surcharge
        const studentCount = await prisma.user.count({
            where: { schoolId: user.school.id, role: 'STUDENT', deletedAt: null },
        })

        // Detect country and calculate base amount using BillingGateway
        const countryCode = req.headers.get('x-vercel-ip-country') || 'US'
        const billingInfo = await getBillingDetails(plan as SubscriptionPlan, billingCycle as 'monthly' | 'annual', countryCode)

        // Per-seat surcharge — only applied if pricePerSeat is configured
        const pricePerSeat = (user as any).school.subscription?.pricePerSeat ?? 0
        const seatSurcharge = pricePerSeat * studentCount

        // Update billedStudentCount snapshot
        if ((user as any).school.subscription && studentCount > 0) {
            await (prisma.subscription.update as any)({
                where: { schoolId: (user as any).school.id },
                data: { billedStudentCount: studentCount },
            })
        }

        // Check seat cap
        const seats = (user as any).school.subscription?.seats
        if (seats !== null && seats !== undefined && studentCount > seats) {
            return NextResponse.json({
                error: `Seat limit exceeded: plan allows ${seats} students, school has ${studentCount}. Upgrade or purchase more seats.`,
                code: 'SEATS_LIMIT_EXCEEDED',
                studentCount,
                seats,
            }, { status: 402 })
        }

        const totalAmount = billingInfo.totalWithTax + seatSurcharge

        let orderId = ''
        let key = process.env.RAZORPAY_KEY_ID

        if (billingInfo.provider === 'RAZORPAY') {
            const order = await razorpay.orders.create({
                amount: totalAmount,
                currency: billingInfo.currencyCode,
                receipt: `order_${(user as any).school.id}_${Date.now()}`,
                notes: {
                    schoolId: (user as any).school.id,
                    plan,
                    billingCycle,
                    studentCount: String(studentCount),
                    seatSurcharge: String(seatSurcharge),
                },
            })
            orderId = order.id
        } else {
            throw new Error(`Stripe gateway integration for country ${countryCode} pending Phase 2 deployment`)
        }

        return NextResponse.json({
            orderId,
            amount: totalAmount,
            baseAmount: billingInfo.totalWithTax,
            seatSurcharge,
            studentCount,
            currency: billingInfo.currencyCode,
            key,
            provider: billingInfo.provider
        })
    } catch (error: any) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout' },
            { status: 500 }
        )
    }
}
