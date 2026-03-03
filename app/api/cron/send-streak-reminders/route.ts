import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendStreakReminderEmail } from '@/lib/emails/templates'
import { createCronLogger } from '@/lib/logger'

/**
 * Cron job to send streak reminder emails
 * Should run daily at 8 PM
 * Reminds students who haven't played today to maintain their streak
 */
export async function GET(req: NextRequest) {
    const log = createCronLogger('send-streak-reminders')
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        log.start()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Find students with active streaks who haven't played today
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                streakData: {
                    currentStreak: {
                        gte: 3, // Only remind students with 3+ day streaks
                    },
                    lastPlayedAt: {
                        lt: today, // Haven't played today
                    },
                },
            },
            include: {
                streakData: true,
            },
        })

        let emailsSent = 0

        for (const student of students) {
            if (!student.streakData) continue

            const multiplier = 1 + student.streakData.currentStreak * 0.1

            try {
                await sendStreakReminderEmail(
                    student.email,
                    student.firstName || 'Student',
                    student.streakData.currentStreak
                )

                emailsSent++

                await (prisma.emailLog.create as any)({
                    data: {
                        userId: student.id,
                        type: 'streak_reminder',
                        subject: 'Don\'t lose your streak!',
                        status: 'SENT',
                    },
                })
            } catch (error) {
                console.error('Failed to send streak reminder:', error)

                await (prisma.emailLog.create as any)({
                    data: {
                        userId: student.id,
                        type: 'streak_reminder',
                        subject: 'Streak reminder failed',
                        status: 'FAILED',
                    },
                })
            }
        }

        log.success({ emailsSent, studentsChecked: students.length })
        return NextResponse.json({ success: true, emailsSent, studentsChecked: students.length })
    } catch (error: any) {
        log.error(error)
        return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 })
    }
}
