import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAssignmentDueEmail } from '@/lib/emails/templates'
import { createCronLogger } from '@/lib/logger'

/**
 * Cron job to send assignment due reminder emails
 * Should run daily at 9 AM
 * Reminds students about assignments due in the next 24 hours
 */
export async function GET(req: NextRequest) {
    const log = createCronLogger('send-assignment-reminders')
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        log.start()

        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        const assignments = await (prisma.assignment.findMany as any)({
            where: {
                dueDate: {
                    gte: now,
                    lte: tomorrow,
                },
            },
            include: {
                class: {
                    include: {
                        enrollments: {
                            include: {
                                student: true,
                            },
                        },
                    },
                },
                gameResults: true,
            },
        })

        let emailsSent = 0

        for (const assignment of assignments) {
            // Get students who haven't completed the assignment
            const completedStudentIds = (assignment as any).gameResults.map((r: any) => r.studentId)

            for (const enrollment of (assignment as any).class.enrollments) {
                const student = enrollment.student

                // Skip if already completed
                if (completedStudentIds.includes(student.id)) continue

                const hoursLeft = Math.floor(
                    (assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
                )

                try {
                    await sendAssignmentDueEmail(
                        student.email,
                        student.firstName || 'Student',
                        assignment.title,
                        assignment.dueDate
                    )

                    emailsSent++

                    await (prisma.emailLog.create as any)({
                        data: {
                            userId: student.id,
                            type: 'assignment_due',
                            subject: `Assignment Due: ${assignment.title}`,
                            status: 'SENT',
                        },
                    })
                } catch (error) {
                    console.error('Failed to send assignment reminder:', error)

                    await (prisma.emailLog.create as any)({
                        data: {
                            userId: student.id,
                            type: 'assignment_due',
                            subject: 'Assignment reminder failed',
                            status: 'FAILED',
                        },
                    })
                }
            }
        }

        log.success({ emailsSent, assignmentsChecked: assignments.length })
        return NextResponse.json({ success: true, emailsSent, assignmentsChecked: assignments.length })
    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 })
    }
}
