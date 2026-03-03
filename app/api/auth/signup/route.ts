import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// ============================================================
// PUBLIC SIGNUP — Only for INDEPENDENT students
// Teachers are created via invite links (see /api/auth/teacher-invite)
// Schools are created by the Owner only (see /api/school/provision)
// ============================================================

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Block any attempt to self-register as TEACHER, SCHOOL, ADMIN, or OWNER
        if (body.role && ['TEACHER', 'SCHOOL', 'ADMIN', 'OWNER'].includes(body.role)) {
            return NextResponse.json(
                { error: 'This registration path is not available. Teachers must use their school invite link.' },
                { status: 403 }
            )
        }

        const validatedData = signupSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10)

        // Create INDEPENDENT user — no schoolId, no teacherId
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                password: hashedPassword,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                name: `${validatedData.firstName} ${validatedData.lastName}`,
                role: 'INDEPENDENT',
                // schoolId: null — independent users have no school
                // teacherId: null — independent users have no teacher
            },
        })

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                message: 'Account created. Please complete payment to activate your subscription.',
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
