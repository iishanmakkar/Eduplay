
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { code } = await req.json()

    if (!code) {
        return new NextResponse('Code required', { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    }) as any

    if (!user || !user.twoFactorSecret) {
        return new NextResponse('2FA setup not initiated', { status: 400 })
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
    })

    if (!verified) {
        return new NextResponse('Invalid code', { status: 400 })
    }

    // Enable 2FA
    await prisma.user.update({
        where: { email: session.user.email },
        data: {
            twoFactorEnabled: true,
        },
    })

    return NextResponse.json({ success: true })
}
