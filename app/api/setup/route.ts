import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ReferralSystem } from '@/lib/gamification/referral-system'

const setupSchema = z.object({
    schoolName: z.string().min(2),
    referralCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { schoolName, referralCode } = setupSchema.parse(body)

        // Only Teachers or Admins can create schools
        if (session.user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Students cannot create schools' }, { status: 403 })
        }

        // Create the school
        const schoolSlug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const school = await (prisma.school.create as any)({
            data: {
                name: schoolName,
                slug: `${schoolSlug}-${Math.random().toString(36).substring(2, 7)}`,
                users: {
                    connect: { id: session.user.id }
                }
            },
        })

        // Create default subscription
        await prisma.subscription.create({
            data: {
                schoolId: school.id,
                plan: 'STARTER',
                status: 'TRIALING',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        })

        // Process potential referral reward
        let referralProcessed = false
        if (referralCode) {
            referralProcessed = await ReferralSystem.processSignup(session.user.id, referralCode)
        }

        return NextResponse.json({ success: true, schoolId: school.id, referralProcessed })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid school name' }, { status: 400 })
        }
        console.error('Setup error:', error)
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
    }
}
