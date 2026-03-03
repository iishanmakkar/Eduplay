import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sign, verify } from 'jsonwebtoken'
import { Resend } from 'resend'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_key')
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { parentEmail } = await req.json()

        if (!parentEmail) {
            return NextResponse.json({ error: 'Parent email is required' }, { status: 400 })
        }

        // Update user to pending, save the parent email
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                parentEmail,
                consentStatus: 'PENDING'
            }
        })

        // Generate a cryptographically signed token that expires in 7 days
        const token = sign(
            { userId: session.user.id, action: 'coppa_consent' },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        const consentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/consent?token=${token}`

        // Send email to parent
        await resend.emails.send({
            from: 'EduPlay Privacy <privacy@eduplay.dev>',
            to: parentEmail,
            subject: 'Action Required: Parental Consent for EduPlay',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Parental Consent Required</h2>
                    <p>Your child has created an account on EduPlay.</p>
                    <p>To comply with COPPA data privacy regulations for users under 13, we require your explicit permission for them to participate.</p>
                    <p>By clicking the link below, you authorize EduPlay to collect and process your child's learning data for educational personalization.</p>
                    <div style="margin: 30px 0;">
                        <a href="${consentUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            I Provide Consent
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">If you do not approve, no action is needed. Unverified accounts are automatically deleted.</p>
                </div>
            `
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Consent Request Error:', error)
        return NextResponse.json({ error: 'Failed to process consent request' }, { status: 500 })
    }
}

// Handle the parent clicking the link (GET)
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const token = url.searchParams.get('token')

        if (!token) {
            return new NextResponse('Missing verification token', { status: 400 })
        }

        // Verify cryptographic signature
        const decoded = verify(token, JWT_SECRET) as { userId: string, action: string }

        if (decoded.action !== 'coppa_consent') {
            return new NextResponse('Invalid token action', { status: 400 })
        }

        // Update the database
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { consentStatus: 'APPROVED' }
        })

        // Redirect to a success page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/consent-success`)
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return new NextResponse('Verification link expired. Please request a new one.', { status: 400 })
        }
        return new NextResponse('Invalid verification link.', { status: 400 })
    }
}
