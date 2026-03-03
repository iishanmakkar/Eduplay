import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

/**
 * POST /api/admin/bulk-import/students
 * Bulk import students from CSV file
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const classId = formData.get('classId') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!classId) {
            return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
        }

        // Verify class ownership
        const classRecord = await prisma.class.findFirst({
            where: {
                id: classId,
                teacherId: session.user.id
            }
        })

        if (!classRecord) {
            return NextResponse.json({ error: 'Class not found or unauthorized' }, { status: 404 })
        }

        // Read CSV file
        const text = await file.text()

        // Parse CSV
        const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })

        const results = {
            total: records.length,
            successful: 0,
            failed: 0,
            errors: [] as any[]
        }

        // Process each student
        for (let i = 0; i < records.length; i++) {
            const record = records[i]

            try {
                // Validate required fields
                const row = record as any
                if (!row.email || !row.name) {
                    results.errors.push({
                        row: i + 2, // +2 for header row and 0-index
                        error: 'Missing required fields (email, name)',
                        data: record
                    })
                    results.failed++
                    continue
                }

                // Check if user already exists
                let user = await prisma.user.findUnique({
                    where: { email: row.email }
                })

                if (!user) {
                    // Create new student user
                    const userRow = record as any
                    user = await prisma.user.create({
                        data: {
                            email: userRow.email,
                            firstName: userRow.firstName || userRow.name?.split(' ')[0] || 'Unknown',
                            lastName: userRow.lastName || userRow.name?.split(' ').slice(1).join(' ') || 'Student',
                            password: '$2a$10$YourHashedPasswordHere', // hashed 'password'
                            role: 'STUDENT',
                            schoolId: session.user.schoolId // Link to teacher's school
                        }
                    })
                }

                // Check if already in class
                const existingEnrollment = await prisma.classStudent.findFirst({
                    where: {
                        classId: classId,
                        studentId: user.id
                    }
                })

                if (!existingEnrollment) {
                    // Add student to class
                    await prisma.classStudent.create({
                        data: {
                            classId: classId,
                            studentId: user.id
                        }
                    })
                }

                results.successful++
            } catch (error: any) {
                results.errors.push({
                    row: i + 2,
                    error: error.message,
                    data: record
                })
                results.failed++
            }
        }

        return NextResponse.json({
            success: true,
            results
        })

    } catch (error: any) {
        console.error('Bulk import error:', error)
        return NextResponse.json({
            error: 'Import failed',
            message: error.message
        }, { status: 500 })
    }
}

/**
 * GET /api/admin/bulk-import/template
 * Download CSV template
 */
export async function GET() {
    const csvTemplate = `email,name,grade,studentId
student1@school.com,John Doe,5,S001
student2@school.com,Jane Smith,5,S002
student3@school.com,Bob Johnson,5,S003`

    return new NextResponse(csvTemplate, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="student_import_template.csv"'
        }
    })
}
