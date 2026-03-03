import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { firstName, lastName } = await request.json()

        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: 'First name and last name are required' },
                { status: 400 }
            )
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
            },
        })

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
            },
        })
    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
