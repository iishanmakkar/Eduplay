import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BillingClient from '@/components/BillingClient'

export default async function BillingPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/auth/signin')
    }

    // Direct access to billing is primarily for teachers/admins who manage the school
    if (session.user.role === 'STUDENT') {
        redirect('/dashboard/student')
    }

    if (!session.user.schoolId) {
        redirect('/dashboard')
    }

    const school = await (prisma.school as any).findUnique({
        where: { id: session.user.schoolId },
        include: {
            subscription: {
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            }
        }
    })

    if (!school) {
        redirect('/dashboard')
    }

    return (
        <BillingClient
            subscription={(school as any).subscription}
            user={{ firstName: session.user.firstName || 'Teacher' }}
        />
    )
}
