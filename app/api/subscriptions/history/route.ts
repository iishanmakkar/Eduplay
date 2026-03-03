import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's school
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                school: {
                    include: {
                        subscription: {
                            include: {
                                transactions: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 50, // Last 50 transactions
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!user?.school?.subscription) {
            return NextResponse.json({ transactions: [] })
        }

        return NextResponse.json({
            transactions: user.school.subscription.transactions,
        })
    } catch (error: any) {
        console.error('Billing history error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch billing history' },
            { status: 500 }
        )
    }
}
