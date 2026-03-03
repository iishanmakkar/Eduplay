import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { dob, parentEmail } = await req.json()

        if (!dob) {
            return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 })
        }

        const birthDate = new Date(dob)
        const age = Math.floor((new Date().getTime() - birthDate.getTime()) / 31557600000)

        if (age < 13 && !parentEmail) {
            return NextResponse.json({ error: 'Parent email is required for users under 13' }, { status: 400 })
        }

        const consentStatus = age < 13 ? 'PENDING' : 'NOT_REQUIRED'

        // Save DOB and conditional parent email to the DB
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                dob: birthDate,
                parentEmail: age < 13 ? parentEmail : null,
                consentStatus
            }
        })

        if (consentStatus === 'PENDING') {
            // Tell the browser to explicitly trigger the consent API call
            return NextResponse.json({ success: true, consentStatus, requiresEmailVerification: true })
        }

        return NextResponse.json({ success: true, consentStatus, requiresEmailVerification: false })
    } catch (error) {
        console.error('COPPA Submit Error:', error)
        return NextResponse.json({ error: 'Failed to save date of birth' }, { status: 500 })
    }
}
