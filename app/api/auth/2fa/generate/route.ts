
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const secret = speakeasy.generateSecret({
        name: `EduPlay SaaS (${session.user.email})`,
    })

    if (!secret.otpauth_url) {
        return new NextResponse('Failed to generate secret', { status: 500 })
    }

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    // Save secret to user but don't enable it yet via a separate call or here?
    // Usually we verify first. So we might need to store it temporarily or just return it and verify against it.
    // However, stateless verification requires sending the secret back or storing it in a temp field.
    // For simplicity, let's store it in the user record but keep enabled=false until verified.

    await prisma.user.update({
        where: { email: session.user.email },
        data: {
            twoFactorSecret: secret.base32,
            // twoFactorEnabled remains false until verified
        },
    })

    return NextResponse.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
    })
}
