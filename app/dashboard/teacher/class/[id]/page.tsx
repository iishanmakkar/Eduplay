import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeacherClassClient from '@/components/TeacherClassClient'

export default async function TeacherClassPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/auth/signin')
    }

    const classData = await prisma.class.findUnique({
        where: { id: params.id },
        include: {
            students: {
                include: {
                    student: {
                        include: {
                            gameResults: {
                                orderBy: { completedAt: 'desc' },
                                take: 5,
                                select: {
                                    id: true,
                                    gameType: true,
                                    score: true,
                                    xpEarned: true,
                                    accuracy: true,
                                    completedAt: true,
                                }
                            },
                            streakData: true,
                            // BKT: top 8 skill masteries per student
                            skillMasteries: {
                                orderBy: { masteryProbability: 'desc' },
                                take: 8,
                                include: {
                                    skill: {
                                        select: { name: true, code: true, subject: true }
                                    }
                                }
                            }
                        },
                    },
                },
            },
            assignments: {
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { gameResults: true },
                    },
                },
            },
        },
    })

    if (!classData || classData.teacherId !== session.user.id) {
        redirect('/dashboard/teacher')
    }

    // Class-wide XP total
    const totalXP = await prisma.gameResult.aggregate({
        where: {
            student: {
                classesEnrolled: {
                    some: { classId: params.id },
                },
            },
        },
        _sum: { xpEarned: true },
    })

    // Compute class-level average BKT mastery P(L)
    const allMasteries = classData.students.flatMap(s => s.student.skillMasteries.map(m => m.masteryProbability))
    const avgMastery = allMasteries.length > 0
        ? allMasteries.reduce((a, b) => a + b, 0) / allMasteries.length
        : 0

    // Check for advanced analytics feature
    const { hasFeature } = await import('@/lib/limits/check')
    const hasAdvancedFeatures = await hasFeature(session.user.schoolId, 'analytics')

    return (
        <TeacherClassClient
            classData={{
                ...classData,
                students: classData.students.map(s => ({
                    student: {
                        ...s.student,
                        firstName: s.student.firstName || 'Student',
                        lastName: s.student.lastName || '',
                    }
                }))
            }}
            totalXP={totalXP._sum.xpEarned || 0}
            avgMastery={avgMastery}
            hasAdvancedFeatures={hasAdvancedFeatures}
        />
    )
}
