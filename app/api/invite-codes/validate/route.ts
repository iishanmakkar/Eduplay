import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/invite-codes/validate
// Validates a class invite code and attaches the student to the class
export async function POST(request: NextRequest) {
    try {
        // PHASE 5: Brute force protection — 5 attempts per minute per IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const rateLimitResult = await rateLimit.heavy.limit(`invite-validate:${ip}`)
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many attempts. Please wait before trying again.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': String(rateLimitResult.limit),
                        'X-RateLimit-Remaining': '0',
                    }
                }
            )
        }

        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only STUDENT role can join classes
        if (session.user.role !== 'STUDENT') {
            return NextResponse.json(
                { error: 'Only students can join classes with invite codes' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { code } = body

        if (!code || typeof code !== 'string' || code.length < 6) {
            return NextResponse.json({ error: 'Invalid invite code format' }, { status: 400 })
        }

        // Look up the invite code
        const inviteCode = await prisma.inviteCode.findUnique({
            where: { code: code.trim().toUpperCase() },
            include: {
                school: true,
                teacher: { select: { id: true, name: true, schoolId: true } },
                class: { select: { id: true, name: true, schoolId: true } },
            },
        })

        if (!inviteCode) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
        }

        // Check if code is active
        if (!inviteCode.isActive) {
            return NextResponse.json({ error: 'This invite code has been deactivated' }, { status: 400 })
        }

        // Check expiry
        if (new Date() > inviteCode.expiresAt) {
            return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 })
        }

        // Check usage limit
        if (inviteCode.usedCount >= inviteCode.usageLimit) {
            return NextResponse.json({ error: 'This invite code has reached its usage limit' }, { status: 400 })
        }

        const studentId = session.user.id

        // Prevent duplicate joins (same student, same class)
        if (inviteCode.classId) {
            const existingEnrollment = await prisma.classStudent.findUnique({
                where: {
                    classId_studentId: {
                        classId: inviteCode.classId,
                        studentId,
                    },
                },
            })

            if (existingEnrollment) {
                return NextResponse.json({ error: 'You are already enrolled in this class' }, { status: 400 })
            }
        }

        // Prevent cross-school joining: if student already has a schoolId, it must match
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { schoolId: true },
        })

        if (student?.schoolId && student.schoolId !== inviteCode.schoolId) {
            return NextResponse.json(
                { error: 'You cannot join a class from a different school' },
                { status: 403 }
            )
        }

        // Atomic transaction: update student + create enrollment + increment usage + EVOLVE: enforce seat limits
        await prisma.$transaction(async (tx) => {
            // Check Seat Limit Quota before allowing enrollment
            const schoolSubscription = await tx.subscription.findUnique({
                where: { schoolId: inviteCode.schoolId },
                select: { seats: true }
            })

            const seatCap = schoolSubscription?.seats

            if (seatCap !== null && seatCap !== undefined) {
                // Count current active students
                const activeStudentsCount = await tx.user.count({
                    where: {
                        schoolId: inviteCode.schoolId,
                        role: 'STUDENT',
                        deletedAt: null
                    }
                })

                if (activeStudentsCount >= seatCap) {
                    throw new Error(`SEAT_LIMIT_REACHED:${seatCap}`)
                }
            }

            // Attach student to school and teacher
            await tx.user.update({
                where: { id: studentId },
                data: {
                    schoolId: inviteCode.schoolId,
                    teacherId: inviteCode.teacherId,
                    role: 'STUDENT',
                },
            })

            // Enroll in class if classId is set
            if (inviteCode.classId) {
                await tx.classStudent.create({
                    data: {
                        classId: inviteCode.classId,
                        studentId,
                    },
                })
            }

            // Increment usage count
            await tx.inviteCode.update({
                where: { id: inviteCode.id },
                data: { usedCount: { increment: 1 } },
            })
        })

        return NextResponse.json({
            success: true,
            schoolId: inviteCode.schoolId,
            teacherId: inviteCode.teacherId,
            classId: inviteCode.classId,
            className: inviteCode.class?.name,
            schoolName: inviteCode.school.name,
        })
    } catch (error: any) {
        if (error.message?.startsWith('SEAT_LIMIT_REACHED')) {
            const limit = error.message.split(':')[1]
            return NextResponse.json({
                error: `School seat limit reached (${limit} seats). Please contact your administrator to upgrade the subscription.`
            }, { status: 403 })
        }

        console.error('Invite code validation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
