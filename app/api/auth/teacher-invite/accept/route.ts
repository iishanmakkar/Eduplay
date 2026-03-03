import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const acceptSchema = z.object({
    token: z.string().min(10),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
})

// POST /api/auth/teacher-invite/accept
// Teachers accept their invite and set their password
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, password, firstName, lastName } = acceptSchema.parse(body)

        // Find the invite by token
        const invite = await prisma.invite.findUnique({
            where: { token },
            include: { inviter: { select: { schoolId: true, role: true } } },
        })

        if (!invite) {
            return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })
        }

        if (invite.status !== 'PENDING') {
            return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
        }

        // Inviter must be a SCHOOL role (school admin)
        if (!(['SCHOOL', 'OWNER'] as string[]).includes(invite.inviter.role as string)) {
            return NextResponse.json({ error: 'Invalid invite source' }, { status: 403 })
        }

        const schoolId = invite.inviter.schoolId
        if (!schoolId) {
            return NextResponse.json({ error: 'Invite source has no school' }, { status: 400 })
        }

        // Check if teacher account already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invite.email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Create teacher account — always attached to schoolId, never via Google
        await prisma.$transaction(async (tx) => {
            await tx.user.create({
                data: {
                    email: invite.email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                    role: 'TEACHER',
                    schoolId, // Always required for teachers
                    // googleId: null — teachers cannot use Google
                },
            })

            // Mark invite as accepted
            await tx.invite.update({
                where: { id: invite.id },
                data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                },
            })
        })

        return NextResponse.json({
            success: true,
            message: 'Teacher account created. You can now sign in with your email and password.',
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
        }
        console.error('Teacher invite accept error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
