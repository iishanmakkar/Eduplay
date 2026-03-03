import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, apiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/students
 * List all students (with pagination and filtering)
 */
export async function GET(request: NextRequest) {
    const auth = await verifyApiKey(request)
    if (!auth.valid) {
        return apiError(auth.error, auth.status)
    }

    const { schoolId } = auth

    try {
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const skip = (page - 1) * limit

        const email = url.searchParams.get('email')
        const name = url.searchParams.get('name')
        const classId = url.searchParams.get('classId')

        const where: any = {
            schoolId,
            role: 'STUDENT'
        }

        if (email) {
            where.email = { contains: email, mode: 'insensitive' }
        }
        if (name) {
            where.OR = [
                { firstName: { contains: name, mode: 'insensitive' } },
                { lastName: { contains: name, mode: 'insensitive' } }
            ]
        }
        if (classId) {
            where.classesEnrolled = { some: { classId } }
        }

        const [students, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true
                }
            }),
            prisma.user.count({ where })
        ])

        return NextResponse.json({
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        return apiError('Internal server error', 500)
    }
}

/**
 * POST /api/v1/students
 * Create a new student for the school
 */
export async function POST(request: NextRequest) {
    const auth = await verifyApiKey(request)
    if (!auth.valid) {
        return apiError(auth.error, auth.status)
    }

    const { schoolId } = auth

    try {
        const body = await request.json()
        const { email, firstName, lastName, classId } = body

        if (!email || !firstName || !lastName) {
            return apiError('Email, first name, and last name are required', 400)
        }

        // Check if student already exists in this school
        let student = await prisma.user.findUnique({
            where: { email }
        })

        if (student) {
            if (student.schoolId !== schoolId) {
                return apiError('Student already belongs to another school', 400)
            }
        } else {
            // Create new student
            student = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password: 'default-student-pass', // Should be changed on first login
                    role: 'STUDENT',
                    schoolId
                }
            })
        }

        // Add to class if specified (verify class belongs to school)
        if (classId) {
            const classRecord = await prisma.class.findFirst({
                where: { id: classId, schoolId }
            })

            if (!classRecord) {
                return apiError('Class not found in this school', 404)
            }

            await prisma.classStudent.upsert({
                where: { classId_studentId: { classId, studentId: student.id } },
                create: { classId, studentId: student.id },
                update: {}
            })
        }

        return NextResponse.json({
            id: student.id,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName
        }, { status: 201 })
    } catch (error) {
        return apiError('Internal server error', 500)
    }
}
