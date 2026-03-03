import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTeacherInvite } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !(['SCHOOL', 'TEACHER'] as string[]).includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Only school admins and teachers can send invites' }, { status: 403 })
        }

        const { emails, message, role } = await request.json()

        if (!Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'Invalid emails' }, { status: 400 })
        }

        // Check limits if inviting teachers (default) or if role specified
        const targetRole = role || 'TEACHER' // Default to teacher if not specified? Or check context.
        // Actually, let's assume this endpoint is for teachers based on previous implementation usage.

        // However, looking at the code, it uses sendTeacherInvite.
        // Let's stick to checking TEACHER limit.

        const { checkLimit } = await import('@/lib/limits/check')
        const limitCheck = await checkLimit(session.user.schoolId, 'teachers')

        // We should also count pending invites? For now just strict user count + incoming.
        if (!limitCheck.allowed || (limitCheck.limit !== -1 && limitCheck.current + emails.length > limitCheck.limit)) {
            return NextResponse.json(
                { error: `Teacher limit reached for ${limitCheck.plan} plan. Upgrade to invite more.` },
                { status: 403 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { school: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const invites = []

        for (const email of emails) {
            // Check if already invited
            const existing = await prisma.invite.findFirst({
                where: {
                    email,
                    invitedBy: session.user.id,
                    status: 'PENDING',
                },
            })

            if (existing) {
                continue // Skip if already invited
            }

            // Generate unique token
            const token = randomBytes(32).toString('hex')
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

            // Create invite
            const invite = await prisma.invite.create({
                data: {
                    email,
                    invitedBy: session.user.id,
                    token,
                    expiresAt,
                },
            })

            // Send email
            await sendTeacherInvite(
                email,
                `${user.firstName} ${user.lastName}`,
                user.school?.name ?? 'Your School',
                token
            )

            invites.push(invite)
        }

        // Award trial extension for inviting (1 day per invite, max 7 days)
        if (invites.length > 0) {
            const subscription = await prisma.subscription.findUnique({
                where: { schoolId: user.schoolId ?? undefined },
            })

            if (subscription && subscription.status === 'TRIALING') {
                const extensionDays = Math.min(invites.length, 7)
                const newPeriodEnd = new Date(subscription.currentPeriodEnd || new Date())
                newPeriodEnd.setDate(newPeriodEnd.getDate() + extensionDays)

                await prisma.subscription.update({
                    where: { schoolId: user.schoolId ?? undefined },
                    data: { currentPeriodEnd: newPeriodEnd },
                })
            }
        }

        return NextResponse.json({
            invites,
            message: `${invites.length} invitation(s) sent successfully`,
            trialExtension: invites.length > 0 ? Math.min(invites.length, 7) : 0,
        })
    } catch (error) {
        console.error('Send invites error:', error)
        return NextResponse.json(
            { error: 'Failed to send invites' },
            { status: 500 }
        )
    }
}
