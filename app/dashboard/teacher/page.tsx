import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeacherDashboardClient from '@/components/TeacherDashboardClient'

export default async function TeacherDashboard() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/auth/signin')
    }

    // Fetch teacher's classes
    const classes = await prisma.class.findMany({
        where: { teacherId: session.user.id },
        include: {
            students: true,
            _count: {
                select: { students: true, assignments: true },
            },
        },
    })

    return (
        <TeacherDashboardClient
            user={{ firstName: session.user.firstName || 'Teacher' }}
            classes={classes}
        />
    )
}
