import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { UserRole } from '@prisma/client'

const provisionSchema = z.object({
    schoolName: z.string().min(2),
    adminEmail: z.string().email(),
    adminFirstName: z.string().min(1),
    adminLastName: z.string().min(1),
    plan: z.enum(['STARTER', 'SCHOOL', 'DISTRICT']).default('STARTER'),
})

// POST /api/school/provision
// OWNER ONLY: Create a new school with its admin account
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Strictly OWNER only
        if (session.user.role !== 'OWNER') {
            return NextResponse.json(
                { error: 'Only the platform owner can provision schools' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { schoolName, adminEmail, adminFirstName, adminLastName, plan } = provisionSchema.parse(body)

        // Check if admin email already exists
        const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
        if (existingUser) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
        }

        // Generate school slug
        const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const uniqueSlug = `${slug}-${crypto.randomBytes(3).toString('hex')}`

        // Generate temporary password for school admin
        const tempPassword = crypto.randomBytes(8).toString('base64url')
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        // Create school + admin + subscription in one transaction
        const { school, adminUser } = await prisma.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name: schoolName,
                    slug: uniqueSlug,
                },
            })

            const adminUser = await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    name: `${adminFirstName} ${adminLastName}`,
                    role: UserRole.SCHOOL,
                    schoolId: school.id,
                },
            })

            await tx.subscription.create({
                data: {
                    schoolId: school.id,
                    plan,
                    status: 'TRIALING',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            })

            return { school, adminUser }
        })

        return NextResponse.json({
            success: true,
            school: { id: school.id, name: school.name, slug: school.slug },
            admin: {
                email: adminUser.email,
                tempPassword, // Send this to the school admin via email
            },
            message: `School "${schoolName}" provisioned. Share the temp password with the admin.`,
        }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
        }
        console.error('School provision error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
