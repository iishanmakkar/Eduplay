import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDailyReminder } from '@/lib/email'
import { createCronLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('send-daily-reminders')
    log.start()

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all students who haven't played today
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                gameResults: {
                    none: {
                        completedAt: {
                            gte: today,
                        },
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
            },
        })

        let sentCount = 0

        for (const student of students) {
            // Check if we've already sent a reminder today
            const existingLog = await prisma.emailLog.findFirst({
                where: {
                    userId: student.id,
                    type: 'DAILY_REMINDER',
                    sentAt: {
                        gte: today,
                    },
                },
            })

            if (existingLog) {
                continue // Already sent today
            }

            // Send reminder
            const result = await sendDailyReminder({
                ...student,
                firstName: student.firstName || 'Student'
            })

            if (result.success) {
                // Log email
                await prisma.emailLog.create({
                    data: {
                        userId: student.id,
                        type: 'DAILY_REMINDER',
                        subject: '🎮 Your daily challenge is waiting!',
                    },
                })
                sentCount++
            }
        }

        log.success({ sentCount, totalStudents: students.length })
        return NextResponse.json({
            message: `Sent ${sentCount} daily reminders`,
            totalStudents: students.length,
        })
    } catch (error) {
        log.error(error)
        return NextResponse.json(
            { error: 'Failed to send reminders' },
            { status: 500 }
        )
    }
}
